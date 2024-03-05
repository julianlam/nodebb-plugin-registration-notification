'use strict';

const Controllers = module.exports;

Controllers.renderAdminPage = function (req, res) {
	res.render('admin/plugins/registration-notification', {
		title: 'Registration Notification',
	});
};
