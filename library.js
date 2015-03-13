"use strict";

var controllers = require('./lib/controllers'),
	user = require.main.require('./src/user'),
	groups = require.main.require('./src/groups'),
	emailer = require.main.require('./src/emailer'),
	meta = require.main.require('./src/meta'),
	notifications = require.main.require('./src/notifications'),

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

plugin.onRegister = function(data, callback) {
	async.parallel({
		method: async.apply(meta.settings.getOne, 'registration-notification', 'method'),
		adminUids: async.apply(groups.getMembers, 'administrators', 0, -1),
		userData: async.apply(user.getUserFields, data.uid, ['username', 'email', 'picture', 'userslug'])
	}, function(err, data) {
		if (data.method === 'email') {
			async.eachSeries(data.adminUids, function(uid, next) {
				emailer.send('new-registration', uid, {
					site_title: (meta.config.title || 'NodeBB'),
					subject: 'New User Registration',
					user: data.userData,
					url: nconf.get('url')
				}, next);
			}, onError);
		} else {
			// No match, send notification
			notifications.create({
				bodyShort: 'A user by the name of ' + data.userData.username + ' has registered',
				bodyLong: '',
				image: data.userData.picture,
				nid: 'plugin:registration-notification:' + data.uid,
				path: 'users/' + data.userData.userslug
			}, function(err, notification) {
				notifications.push(notification, data.adminUids, onError);
			});
		}
	});

	var onError = function(err) {
		if (err) {
			winston.error('[plugin/registration-notification] Encountered an error while notifying admins.');
			console.log(err.stack);
		}
	};

	callback(null, data);
};

module.exports = plugin;