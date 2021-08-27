"use strict";

const controllers = require('./lib/controllers');
const user = require.main.require('./src/user');
const groups = require.main.require('./src/groups');
const emailer = require.main.require('./src/emailer');
const meta = require.main.require('./src/meta');
const notifications = require.main.require('./src/notifications');
const slugify = require.main.require('./src/slugify');

const async = require.main.require('async');
const nconf = require.main.require('nconf');
const winston = require.main.require('winston');

const plugin = module.exports;

plugin.init = function(params, callback) {
	var router = params.router,
		hostMiddleware = params.middleware,
		hostControllers = params.controllers;

	// We create two routes for every view. One API call, and the actual route itself.
	// Just add the buildHeader middleware to your route and NodeBB will take care of everything for you.

	router.get('/admin/plugins/registration-notification', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
	router.get('/api/admin/plugins/registration-notification', controllers.renderAdminPage);

	callback();
};

plugin.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/plugins/registration-notification',
		icon: 'fa-tint',
		name: 'Registration Notification'
	});

	callback(null, header);
};

plugin.onRegister = function(data) {
	var allowed = ['normal', 'invite-only', 'admin-invite-only'];
	if (allowed.indexOf(meta.config.registrationType) !== -1) {
		sendNotification(data);
	}
};

plugin.onQueued = function(data, callback) {
	var allowed = ['admin-approval', 'admin-approval-ip'];
	if (allowed.includes(meta.config.registrationApprovalType)) {
		var payload = data.userData;
		payload.userslug = slugify(payload.username);
		sendNotification({
			user: payload,
		});
	}
	callback(null, data);
};

async function sendNotification(data) {
	let method = await meta.settings.getOne('registration-notification', 'method');
	const adminUids = await groups.getMembers('administrators', 0, -1);

	try {
		method = JSON.parse(method) || [];
	} catch (e) {
		method = [];
	}

	if (method.includes('email')) {
		var site_title = meta.config.title !== undefined ? meta.config.title : 'NodeBB';

		try {
			await Promise.all(adminUids.map(async (uid) => {
				await emailer.send('new-registration', uid, {
					site_title: site_title,
					subject: '[' + site_title + '] New User Registration',
					user: data.user,
					url: nconf.get('url')
				});
			}));
		} catch (e) {
			onError(e);
		}
	}

	if (method.includes('notification')) {
		// No match, send notification
		const notification = await notifications.create({
			bodyShort: 'A user by the name of ' + data.user.username + ' has registered',
			bodyLong: '',
			image: data.user.picture,
			nid: 'plugin:registration-notification:' + Date.now(),
			path: '/user/' + data.user.userslug
		});

		try {
			await notifications.push(notification, adminUids);
		} catch (e) {
			onError(e);
		}
	}

	var onError = function(err) {
		if (err) {
			winston.error('[plugin/registration-notification] Encountered an error while notifying admins.');
			console.log(err.stack);
		}
	};
};
