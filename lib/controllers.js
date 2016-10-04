'use strict';

var plugins = require.main.require('./src/plugins'),

	Controllers = {};

Controllers.renderAdminPage = function (req, res, next) {
	res.render('admin/plugins/registration-notification', {});
};

module.exports = Controllers;
