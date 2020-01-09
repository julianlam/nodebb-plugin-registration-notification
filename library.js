"use strict";

var controllers = require('./lib/controllers'),
	user = require.main.require('./src/user'),
	groups = require.main.require('./src/groups'),
	emailer = require.main.require('./src/emailer'),
	meta = require.main.require('./src/meta'),
	notifications = require.main.require('./src/notifications'),
	utils = require.main.require('./public/src/utils'),

	async = require.main.require('async'),
	nconf = require.main.require('nconf'),
	winston = require.main.require('winston'),

	plugin = {};

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
		payload.userslug = utils.slugify(payload.username);
		sendNotification({
			user: payload,
		});
	} 
	callback(null, data);
};

function sendNotification(data) {
	async.parallel({
		method: async.apply(meta.settings.getOne, 'registration-notification', 'method'),
		adminUids: async.apply(groups.getMembers, 'administrators', 0, -1)
	}, function(err, metadata) {
		if (metadata.method === 'email') {
			var site_title = meta.config.title !== undefined ? meta.config.title : 'NodeBB';

			async.eachSeries(metadata.adminUids, function(uid, next) {
				emailer.send('new-registration', uid, {
					site_title: site_title,
					subject: '[' + site_title + '] New User Registration',
					user: data.user,
					url: nconf.get('url')
				}, next);
			}, onError);
		} else {
			// No match, send notification
			notifications.create({
				bodyShort: 'A user by the name of ' + data.user.username + ' has registered',
				bodyLong: '',
				image: data.user.picture,
				nid: 'plugin:registration-notification:' + Date.now(),
				path: '/user/' + data.user.userslug
			}, function(err, notification) {
				notifications.push(notification, metadata.adminUids, onError);
			});
		}
	});

	var onError = function(err) {
		if (err) {
			winston.error('[plugin/registration-notification] Encountered an error while notifying admins.');
			console.log(err.stack);
		}
	};
};

module.exports = plugin;
