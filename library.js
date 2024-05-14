'use strict';

const controllers = require('./lib/controllers');

const groups = require.main.require('./src/groups');
const emailer = require.main.require('./src/emailer');
const meta = require.main.require('./src/meta');
const notifications = require.main.require('./src/notifications');
const slugify = require.main.require('./src/slugify');

const nconf = require.main.require('nconf');
const winston = require.main.require('winston');

const plugin = module.exports;

plugin.init = async function (params) {
	const { router } = params;
	const routeHelpers = require.main.require('./src/routes/helpers');
	routeHelpers.setupAdminPageRoute(router, '/admin/plugins/registration-notification', controllers.renderAdminPage);
};

plugin.addAdminNavigation = function (header) {
	header.plugins.push({
		route: '/plugins/registration-notification',
		icon: 'fa-tint',
		name: 'Registration Notification',
	});
	return header;
};

plugin.onRegister = async function (data) {
	const allowed = (await meta.settings.getOne('registration-notification', 'registerType')) ||
		['normal', 'invite-only', 'admin-invite-only'];
	if (allowed.includes(meta.config.registrationType) || allowed.includes('all')) {
		sendNotification(data);
	}
};

plugin.onQueued = function (data, callback) {
	const allowed = ['admin-approval', 'admin-approval-ip'];
	if (allowed.includes(meta.config.registrationApprovalType)) {
		const payload = data.userData;
		payload.userslug = slugify(payload.username);
		sendNotification({
			user: payload,
		});
	}
	callback(null, data);
};

function onError(err) {
	if (err) {
		winston.error('[plugin/registration-notification] Encountered an error while notifying admins.');
		console.log(err.stack);
	}
}

async function sendNotification(data) {
	let method = await meta.settings.getOne('registration-notification', 'method');
	const adminUids = await groups.getMembers('administrators', 0, -1);

	try {
		method = JSON.parse(method) || [];
	} catch (e) {
		method = [];
	}

	if (method.includes('email')) {
		const site_title = meta.config.title || 'NodeBB';

		try {
			await Promise.all(adminUids.map(async (uid) => {
				await emailer.send('new-registration', uid, {
					site_title: site_title,
					subject: `[${site_title}] New User Registration`,
					user: data.user,
					url: nconf.get('url'),
				});
			}));
		} catch (err) {
			onError(err);
		}
	}

	if (method.includes('notification')) {
		// No match, send notification
		const notification = await notifications.create({
			bodyShort: `A user by the name of ${data.user.username} has registered`,
			bodyLong: '',
			image: data.user.picture,
			nid: `plugin:registration-notification:${Date.now()}`,
			path: `/user/${data.user.userslug}`,
		});

		try {
			await notifications.push(notification, adminUids);
		} catch (e) {
			onError(e);
		}
	}
}
