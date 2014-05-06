var async = require('async');
var multiparty = require('multiparty');
var Article = require('./../models/Article.js');
var Picture = require('./../models/Picture.js');
var Tag = require('./../models/Tag.js');
var User = require('./../models/User.js');
var Textfile = require('./../models/Textfile.js');
var message = require('../config.js').message;
var config = require('../config.js').config;
var utils = require('../utils.js');
// var Tag = require('./../models/Tag.js');
// var User = require('./../models/User.js');

//获取文章信息
exports.getArticleInfos = function(req, res) {
	Article.selectArray(null, null, null, Article.INFO_FIELDS.join(' '), function(err, results) {
		if (err) {
			res.send({success: false, msg: err});
		} else {
			res.send(results);
		}
	});
};

//批量更新
exports.updateArticles = function(req, res) {
	var articleIds = Array.isArray(req.query.articleIds) ? req.query.articleIds : [req.query.articleIds];
	// var articles = Array.isArray(req.query.articles) ? req.query.articles : [req.query.articles];
	// var articles = req.body.articles;
	// Article.update({_id: {$in: articles.map(function(article) {return article._id})}, )

	Article.update({_id: {$in: articleIds}}, {$set: article}, { multi: true })
	.exec(function(err) {
		if (err) {
			res.send({success: false, msg: err});
		} else {
			res.send({success: true, msg: message.REMOVE_SUCCESS});
		}
	});

	async.each(articles, function(article, callback) {
		Article.update(article, function(err) {
			callback(err);
		});
	}, function(err) {
		if (err) {
			res.send({success: false, msg: err});
		} else {
			res.send({success: true, msg: message.UPDATE_SUCCESS});
		}
	});
};

//批量删除
exports.removeArticles = function(req, res) {
	var articleIds = Array.isArray(req.query.articleIds) ? req.query.articleIds : [req.query.articleIds];

	Article.remove({_id: {$in: articleIds}})
	.exec(function(err) {
		if (err) {
			res.send({success: false, msg: err});
		} else {
			res.send({success: true, msg: message.REMOVE_SUCCESS});
		}
	});

	// async.each(articleIds, function(id, callback) {
	// 	Article.removeById(id, function(err) {
	// 		callback(err);
	// 	});
	// }, function(err) {
	// 	if (err) {
	// 		res.send({success: false, msg: err});
	// 	} else {
	// 		res.send({success: true, msg: message.REMOVE_SUCCESS});
	// 	}
	// });
};

//获取文章
exports.getArticle = function(req, res) {
	Article.findOne({'alias': req.query.alias})
	.select(Article.FIELDS.join(' '))
	.exec(function(err, article) {
		if (err) {
			res.send({success: false, msg: err});
		} else {
			res.send(article);
		}
	});
};

//提交文章
exports.postArticle = function(req, res) {
	var article = new Article(req.body);

	async.parallel([
		function(callback) { article.save(callback); },
		function(callback) { Tag.saveNews(article.tags, callback); },
		function(callback) { Picture.updateByArticleIds(article.imageIds, article._id, callback) }
	], function(err) {
		if (err) {
			res.send({success: false, msg: err});
		} else {
			res.send({success: true, msg: message.INSERT_SUCCESS});
		}
	});
};

exports.updateArticle = function(req, res) {
	var article = req.body;

	Article.findOne({_id: article._id})
	.exec(function(err, oldArticle) {
		if (err) {
			return res.send({success: false, msg: err});
		}
		
		async.parallel([
			function(callback) { oldArticle.updateTo(article, callback); },
			function(callback) { Tag.saveNews(article.tags, callback); },
			function(callback) { Picture.updateByArticleIds(article.imageIds || [], article._id, callback) }
		], function(err) {
			if (err) {
				res.send({success: false, msg: err});
			} else {
				res.send({success: true, msg: message.UPDATE_SUCCESS});
			}
		});
	});
	
	// async.parallel([
	// 	function(callback) { Article.updateById(article, callback); },
	// 	function(callback) { Tag.saveNews(article.tags, callback); },
	// 	function(callback) { Picture.updateByArticleIds(article.imageIds || [], article._id, callback) }
	// ], function(err) {
	// 	if (err) {
	// 		res.send({success: false, msg: err});
	// 	} else {
	// 		res.send({success: true, msg: message.UPDATE_SUCCESS});
	// 	}
	// });
};

//删除文章
exports.removeArticle = function(req, res) {
	Article.findById(req.query.id, function(err, article) {
		if (err) {
			res.send({success: false, msg: err});
		} else {
			async.parallel([
				function(callback) { article.remove(callback) },
				function(callback) { Picture.removeByArticleIds(article.imageIds, article._id, callback) }
			], function(err) {
				if (err) {
					res.send({success: false, msg: err});
				} else {
					res.send({success: true, msg: message.REMOVE_SUCCESS});
				}
			});
		}
	});
};

exports.saveImage = function(req, res) {
	var form = new multiparty.Form(config.MULTIPARTY_OPTIONS);

	form.parse(req, function(err, fields, files){
		if (err) {
			res.send({success: false, msg: err});
		}
		
		var file = {};
		file.name = files.file[0].originalFilename;
		file.type = files.file[0].headers['content-type'] || null;
		file.path = files.file[0].path;
		file.size = files.file[0].size;

		// var verifyMsg = Picture.verify(file);
		// if (verifyMsg.length != 0) {
		// 	res.send({success: false, msg: verifyMsg});
		// 	return;
		// }

		Picture.insertAndSave({
	        name: file.name,
	        originPath: file.path,
	        type: file.type.split('/')[1].toLowerCase()
	    }, function(err, data) {
			if (err) {
				res.send({success: false, msg: err});
			} else {
				res.send({success: true, msg: message.UPLOAD_IMAGE_SUCCESS, image: data});
			}

			utils.deleteContentsInDir(config.MULTIPARTY_OPTIONS.uploadDir);
		});

		// new Picture({
	 //        name: file.name,
	 //        originPath: file.path,
	 //        type: file.type.split('/')[1].toLowerCase()
	 //    })
	 //    .pretreat()
	 //    .save(file, function(err, data) {
		// 	if (err) {
		// 		res.send({success: false, msg: err});
		// 	} else {
		// 		res.send({success: true, msg: message.UPLOAD_IMAGE_SUCCESS, image: data});
		// 	}

		// 	utils.deleteContentsInDir(config.MULTIPARTY_OPTIONS.uploadDir);
		// });
	});
};

exports.saveSiteInfo = function(req, res) {
	Textfile.update(req.body, function(err) {
		if (err) {
			res.send({success: false, msg: err});
		} else {
			res.send({success: true, msg: message.SITE_INFO_UPDATE_SUCCESS});
		}
	});
};

exports.login = function(req, res) {
	if (req.cookies.user) {
		req.session.username = req.cookies.user.username;
		res.send({success: true});
		return;
	}
	console.log(req.body.remember);

	User.getAuthenticated(req.body.username, req.body.password, function(err, user, reasons) {
		if (err) {
			res.send({success: false, msg: err});
			return;
		}

		switch (reasons) {
			case User.failedLogin.NOT_FOUND:
				res.send({success: false, msg: message.INCORRECT_OR_NOT_FOUND});
				return;
			case User.failedLogin.PASSWORD_INCORRECT:
				res.send({success: false, msg: message.INCORRECT_OR_NOT_FOUND});
				return;
			case User.failedLogin.MAX_ATTEMPTS:
				res.send({success: false, msg: message.USER_LOCKED});
				return;
		}

		req.session.username = user.username;

		if (req.body.remember) {
			var month = 30 * 24 * 60 * 60 * 1000;
			res.cookie('user', user, { maxAge: month });
		}

		res.send({success: true});

		return;
	});
};

exports.authenticate = function(req, res, next) {

	if (!req.session.username) {
		if (req.cookies.user) {
			req.session.username = req.cookies.user.username;
			next();
			return;
		} else {
			res.redirect('/login');
			return;
		}
	}

	next();
};