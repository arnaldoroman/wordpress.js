CREATE TABLE IF NOT EXISTS `wp_2_options` (
  `option_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `blog_id` int(11) NOT NULL DEFAULT '0',
  `option_name` varchar(64) NOT NULL DEFAULT '',
  `option_value` longtext NOT NULL,
  `autoload` varchar(20) NOT NULL DEFAULT 'yes',
  PRIMARY KEY (`option_id`),
  UNIQUE KEY `option_name` (`option_name`)
);

REPLACE INTO `wp_2_options` VALUES (1,0,'siteurl','http://example.com/foo','yes'),(2,0,'blogname','foo','yes'),(3,0,'blogdescription','','yes'),(4,0,'users_can_register','0','yes'),(5,0,'admin_email','you@example.com','yes'),(6,0,'start_of_week','1','yes'),(7,0,'use_balanceTags','0','yes'),(8,0,'use_smilies','1','yes'),(9,0,'require_name_email','1','yes'),(10,0,'comments_notify','1','yes'),(11,0,'posts_per_rss','10','yes'),(12,0,'rss_use_excerpt','0','yes'),(13,0,'mailserver_url','mail.example.com','yes'),(14,0,'mailserver_login','login@example.com','yes'),(15,0,'mailserver_pass','password','yes'),(16,0,'mailserver_port','110','yes'),(17,0,'default_category','1','yes'),(18,0,'default_comment_status','open','yes'),(19,0,'default_ping_status','open','yes'),(20,0,'default_pingback_flag','1','yes'),(21,0,'default_post_edit_rows','20','yes'),(22,0,'posts_per_page','10','yes'),(23,0,'date_format','F j, Y','yes'),(24,0,'time_format','g:i a','yes'),(25,0,'links_updated_date_format','F j, Y g:i a','yes'),(26,0,'links_recently_updated_prepend','<em>','yes'),(27,0,'links_recently_updated_append','</em>','yes'),(28,0,'links_recently_updated_time','120','yes'),(29,0,'comment_moderation','0','yes'),(30,0,'moderation_notify','1','yes'),(31,0,'permalink_structure','/%year%/%monthnum%/%day%/%postname%/','yes'),(32,0,'gzipcompression','0','yes'),(33,0,'hack_file','0','yes'),(34,0,'blog_charset','UTF-8','yes'),(35,0,'moderation_keys','','no'),(36,0,'active_plugins','a:0:{}','yes'),(37,0,'home','http://example.com/foo','yes'),(38,0,'category_base','','yes'),(39,0,'ping_sites','http://rpc.pingomatic.com/','yes'),(40,0,'advanced_edit','0','yes'),(41,0,'comment_max_links','2','yes'),(42,0,'gmt_offset','0','yes'),(43,0,'default_email_category','1','yes'),(44,0,'recently_edited','','no'),(45,0,'template','twentyeleven','yes'),(46,0,'stylesheet','twentyeleven','yes'),(47,0,'comment_whitelist','1','yes'),(48,0,'blacklist_keys','','no'),(49,0,'comment_registration','0','yes'),(50,0,'rss_language','en','yes'),(51,0,'html_type','text/html','yes'),(52,0,'use_trackback','0','yes'),(53,0,'default_role','subscriber','yes'),(54,0,'db_version','19470','yes'),(55,0,'uploads_use_yearmonth_folders','1','yes'),(56,0,'upload_path','wp-content/blogs.dir/2/files','yes'),(57,0,'blog_public','1','yes'),(58,0,'default_link_category','2','yes'),(59,0,'show_on_front','posts','yes'),(60,0,'tag_base','','yes'),(61,0,'show_avatars','1','yes'),(62,0,'avatar_rating','G','yes'),(63,0,'upload_url_path','','yes'),(64,0,'thumbnail_size_w','150','yes'),(65,0,'thumbnail_size_h','150','yes'),(66,0,'thumbnail_crop','1','yes'),(67,0,'medium_size_w','300','yes'),(68,0,'medium_size_h','300','yes'),(69,0,'avatar_default','mystery','yes'),(70,0,'enable_app','0','yes'),(71,0,'enable_xmlrpc','0','yes'),(72,0,'large_size_w','1024','yes'),(73,0,'large_size_h','1024','yes'),(74,0,'image_default_link_type','file','yes'),(75,0,'image_default_size','','yes'),(76,0,'image_default_align','','yes'),(77,0,'close_comments_for_old_posts','0','yes'),(78,0,'close_comments_days_old','14','yes'),(79,0,'thread_comments','1','yes'),(80,0,'thread_comments_depth','5','yes'),(81,0,'page_comments','0','yes'),(82,0,'comments_per_page','50','yes'),(83,0,'default_comments_page','newest','yes'),(84,0,'comment_order','asc','yes'),(85,0,'sticky_posts','a:0:{}','yes'),(86,0,'widget_categories','a:0:{}','yes'),(87,0,'widget_text','a:0:{}','yes'),(88,0,'widget_rss','a:0:{}','yes'),(89,0,'timezone_string','','yes'),(90,0,'embed_autourls','1','yes'),(91,0,'embed_size_w','','yes'),(92,0,'embed_size_h','600','yes'),(93,0,'page_for_posts','0','yes'),(94,0,'page_on_front','0','yes'),(95,0,'default_post_format','0','yes'),(96,0,'fileupload_url','http://example.com/foo/files','yes'),(97,0,'WPLANG','','yes'),(99,0,'widget_search','a:2:{i:2;a:1:{s:5:\"title\";s:0:\"\";}s:12:\"_multiwidget\";i:1;}','yes'),(100,0,'widget_recent-posts','a:2:{i:2;a:2:{s:5:\"title\";s:0:\"\";s:6:\"number\";i:5;}s:12:\"_multiwidget\";i:1;}','yes'),(101,0,'widget_recent-comments','a:2:{i:2;a:2:{s:5:\"title\";s:0:\"\";s:6:\"number\";i:5;}s:12:\"_multiwidget\";i:1;}','yes'),(102,0,'widget_archives','a:2:{i:2;a:3:{s:5:\"title\";s:0:\"\";s:5:\"count\";i:0;s:8:\"dropdown\";i:0;}s:12:\"_multiwidget\";i:1;}','yes'),(103,0,'widget_meta','a:2:{i:2;a:1:{s:5:\"title\";s:0:\"\";}s:12:\"_multiwidget\";i:1;}','yes'),(104,0,'can_compress_scripts','1','yes'),(106,0,'current_theme','Twenty Eleven','yes'),(107,0,'initial_db_version','19470','yes'),(110,0,'bio','Bacon ipsum dolor sit amet strip steak t-bone sint occaecat aliqua rump id tri-tip ut leberkas esse biltong beef spare ribs. Chuck in drumstick swine mollit anim occaecat ball tip sint veniam velit venison tri-tip laborum.','yes'),(111,0,'name','Bacon Lover','yes'),(112,0,'location','Sydney','yes'),(113,0,'twitter','bacon','yes'),(114,0,'facebook','www.facebook.com/republicofbacon','yes'),(115,0,'email','bacon@gmail.com','yes'),(116,0,'instagram','bacon','yes'),(117,0,'tumblr','bacon','yes'),(118,0,'pinterest','bacon','yes'),(119,0,'googleplus','117770524699304223125','yes'),(120,0,'youtube','bacon','yes'),(121,0,'bloglovin','www.bloglovin.com/blog/4137997/oracle-fox','yes'),(122,0,'fixtures','1','yes'),(123,0,'pinterest_pins','1','yes');

CREATE TABLE IF NOT EXISTS `wp_2_postmeta` (
  `meta_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint(20) unsigned NOT NULL DEFAULT '0',
  `meta_key` varchar(255) DEFAULT NULL,
  `meta_value` longtext,
  PRIMARY KEY (`meta_id`),
  KEY `post_id` (`post_id`),
  KEY `meta_key` (`meta_key`)
);

REPLACE INTO `wp_2_postmeta` VALUES (1,1,'frontpage-post-type','Video'),(2,1,'_thumbnail_id','100001'),(3,1,'orientation','top'),(4,1,'original_title','Bacon ipsum'),(7,2,'frontpage-post-type','Quick'),(8,2,'_thumbnail_id','100001'),(9,2,'orientation','top'),(10,2,'original_title','Ham andouille speck'),(13,3,'frontpage-post-type','Video'),(14,3,'_thumbnail_id','100001'),(15,3,'orientation','top'),(16,3,'original_title','Dolor sit amet meatball');

CREATE TABLE IF NOT EXISTS `wp_2_posts` (
  `ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `post_author` bigint(20) unsigned NOT NULL DEFAULT '0',
  `post_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_date_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_content` longtext NOT NULL,
  `post_title` text NOT NULL,
  `post_excerpt` text NOT NULL,
  `post_status` varchar(20) NOT NULL DEFAULT 'publish',
  `comment_status` varchar(20) NOT NULL DEFAULT 'open',
  `ping_status` varchar(20) NOT NULL DEFAULT 'open',
  `post_password` varchar(20) NOT NULL DEFAULT '',
  `post_name` varchar(200) NOT NULL DEFAULT '',
  `to_ping` text NOT NULL,
  `pinged` text NOT NULL,
  `post_modified` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_modified_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_content_filtered` text NOT NULL,
  `post_parent` bigint(20) unsigned NOT NULL DEFAULT '0',
  `guid` varchar(255) NOT NULL DEFAULT '',
  `menu_order` int(11) NOT NULL DEFAULT '0',
  `post_type` varchar(20) NOT NULL DEFAULT 'post',
  `post_mime_type` varchar(100) NOT NULL DEFAULT '',
  `comment_count` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  KEY `post_name` (`post_name`),
  KEY `type_status_date` (`post_type`,`post_status`,`post_date`,`ID`),
  KEY `post_parent` (`post_parent`),
  KEY `post_author` (`post_author`)
);

REPLACE INTO `wp_2_posts` VALUES (1,0,'2011-11-10 00:10:00','2011-11-10 00:00:00','http://www.youtube.com/watch?v=FzRH3iTQPrk<br /><br />Shankle brisket pancetta leberkas. Bresaola sirloin pork chop ribeye beef ribs, pork loin ham hock meatball bacon tail pork jowl drumstick turducken corned beef. Cow drumstick sausage filet mignon speck fatback pork loin. Jerky meatloaf capicola short ribs drumstick. Corned beef rump fatback ham speck swine, sirloin bresaola jowl shankle ham hock beef. Salami chicken biltong fatback, ham shankle kielbasa shoulder bacon turducken hamburger corned beef boudin short ribs.<br /><img src=\"/foo/files/2011/01/1.jpg\" /><br /><img src=\"/foo/files/2011/01/2.jpg\" title=\"Has anyone really been far even as?\" /><br /><img src=\"/foo/files/2011/01/1.jpg\" title=\"All your base are belong to us\" />','Bacon ipsum','Has anyone really been far even as decided to use even go want to do look more like?','publish','open','open','','bacon-ipsum','','','2013-05-21 10:40:31','2013-05-21 10:30:31','',0,'',0,'post','',0),(2,0,'2009-08-04 00:10:00','2009-08-04 00:00:00','Capicola brisket bacon, short loin shank biltong pastrami corned beef jowl tenderloin. Drumstick brisket boudin, ribeye fatback prosciutto bresaola ham. Beef pork loin ham ribeye prosciutto, t-bone tail. Kielbasa speck boudin, jowl capicola prosciutto drumstick ribeye spare ribs turducken pork frankfurter shankle sausage ham hock. Biltong pork loin pastrami pig ham, tail tri-tip andouille bresaola rump meatloaf hamburger fatback shoulder shankle. Tongue pork short ribs, beef ribs pork chop filet mignon drumstick. Bacon leberkas ham hock pancetta, spare ribs hamburger sausage shankle jowl meatloaf t-bone kielbasa.<br /><p>Go use <a href=\"http://google.com/\">Google</a> to search for stuff, or maybe <a href=\"http://bing.com\">Bing</a></p><br /><img src=\"/foo/files/2011/01/1.jpg\" /><br /><img src=\"/foo/files/2011/01/2.jpg\" title=\"Has anyone really been far even as?\" /><br /><img src=\"/foo/files/2011/01/2.jpg\" title=\"Has anyone really been far even as?\" />','Ham andouille speck','Has anyone really been far even as decided to use even go want to do look more like?','publish','open','open','','','','','2013-05-21 10:40:31','2013-05-21 10:30:31','',0,'',0,'post','',0),(3,0,'2010-04-24 00:10:00','2010-04-24 00:00:00','http://www.youtube.com/watch?v=QH2-TGUlwu4<br /><br />Shankle brisket pancetta leberkas. Bresaola sirloin pork chop ribeye beef ribs, pork loin ham hock meatball bacon tail pork jowl drumstick turducken corned beef. Cow drumstick sausage filet mignon speck fatback pork loin. Jerky meatloaf capicola short ribs drumstick. Corned beef rump fatback ham speck swine, sirloin bresaola jowl shankle ham hock beef. Salami chicken biltong fatback, ham shankle kielbasa shoulder bacon turducken hamburger corned beef boudin short ribs.<br /><img src=\"/foo/files/2011/01/2.jpg\" /><br /><img src=\"/foo/files/2011/01/1.jpg\" title=\"Has anyone really been far even as?\" /><br /><img src=\"/foo/files/2011/01/2.jpg\" title=\"Has anyone really been far even as?\" />','Dolor sit amet meatball','','publish','open','open','','dolor-sit-amet-meatball','','','2013-05-21 10:40:31','2013-05-21 10:30:31','',0,'',0,'post','',0),(100000,0,'2013-05-21 10:40:31','2013-05-21 10:30:31','','','','publish','open','open','','','','','2013-05-21 10:40:31','2013-05-21 10:30:31','',0,'/foo/files/2011/01/1.jpg',0,'attachment','',0),(100001,0,'2013-05-21 10:40:31','2013-05-21 10:30:31','','','','publish','open','open','','','','','2013-05-21 10:40:31','2013-05-21 10:30:31','',0,'/foo/files/2011/01/2.jpg',0,'attachment','',0);

CREATE TABLE IF NOT EXISTS `wp_2_term_relationships` (
  `object_id` bigint(20) unsigned NOT NULL DEFAULT '0',
  `term_taxonomy_id` bigint(20) unsigned NOT NULL DEFAULT '0',
  `term_order` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`object_id`,`term_taxonomy_id`),
  KEY `term_taxonomy_id` (`term_taxonomy_id`)
);

REPLACE INTO `wp_2_term_relationships` VALUES (1,2,0),(1,3,0),(1,4,0),(2,3,0),(2,6,0),(2,7,0),(2,8,0),(3,7,0),(3,10,0),(3,11,0);

CREATE TABLE IF NOT EXISTS `wp_2_term_taxonomy` (
  `term_taxonomy_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `term_id` bigint(20) unsigned NOT NULL DEFAULT '0',
  `taxonomy` varchar(32) NOT NULL DEFAULT '',
  `description` longtext NOT NULL,
  `parent` bigint(20) unsigned NOT NULL DEFAULT '0',
  `count` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`term_taxonomy_id`),
  UNIQUE KEY `term_id_taxonomy` (`term_id`,`taxonomy`),
  KEY `taxonomy` (`taxonomy`)
);

REPLACE INTO `wp_2_term_taxonomy` VALUES (1,1,'category','',0,0),(2,2,'category','',0,0),(3,3,'category','',0,0),(4,4,'post_tag','',0,0),(6,6,'category','',0,0),(7,7,'post_tag','',0,0),(8,8,'post_tag','',0,0),(10,10,'category','',0,0),(11,11,'category','',0,0),(100,12,'category','',3,0),(101,13,'category','',12,0);

CREATE TABLE IF NOT EXISTS `wp_2_terms` (
  `term_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL DEFAULT '',
  `slug` varchar(200) NOT NULL DEFAULT '',
  `term_group` bigint(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`term_id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `name` (`name`)
);

REPLACE INTO `wp_2_terms` VALUES (1,'Uncategorized','uncategorized',0),(2,'Personal','personal',0),(3,'Shopping','shopping',0),(4,'Radical','radical',0),(6,'Photography','photography',0),(7,'Awesome','awesome',0),(8,'Yolo','yolo',0),(10,'Accessories','accessories',0),(11,'Inspiration','inspiration',0),(12,'Subcategory','subcategory',0),(13,'Subsubcategory','subsubcategory',0);

CREATE TABLE IF NOT EXISTS `wp_3_options` (
  `option_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `blog_id` int(11) NOT NULL DEFAULT '0',
  `option_name` varchar(64) NOT NULL DEFAULT '',
  `option_value` longtext NOT NULL,
  `autoload` varchar(20) NOT NULL DEFAULT 'yes',
  PRIMARY KEY (`option_id`),
  UNIQUE KEY `option_name` (`option_name`)
);

REPLACE INTO `wp_3_options` VALUES (1,0,'siteurl','http://example.com/bar','yes'),(2,0,'blogname','bar','yes'),(3,0,'blogdescription','','yes'),(4,0,'users_can_register','0','yes'),(5,0,'admin_email','you@example.com','yes'),(6,0,'start_of_week','1','yes'),(7,0,'use_balanceTags','0','yes'),(8,0,'use_smilies','1','yes'),(9,0,'require_name_email','1','yes'),(10,0,'comments_notify','1','yes'),(11,0,'posts_per_rss','10','yes'),(12,0,'rss_use_excerpt','0','yes'),(13,0,'mailserver_url','mail.example.com','yes'),(14,0,'mailserver_login','login@example.com','yes'),(15,0,'mailserver_pass','password','yes'),(16,0,'mailserver_port','110','yes'),(17,0,'default_category','1','yes'),(18,0,'default_comment_status','open','yes'),(19,0,'default_ping_status','open','yes'),(20,0,'default_pingback_flag','1','yes'),(21,0,'default_post_edit_rows','20','yes'),(22,0,'posts_per_page','10','yes'),(23,0,'date_format','F j, Y','yes'),(24,0,'time_format','g:i a','yes'),(25,0,'links_updated_date_format','F j, Y g:i a','yes'),(26,0,'links_recently_updated_prepend','<em>','yes'),(27,0,'links_recently_updated_append','</em>','yes'),(28,0,'links_recently_updated_time','120','yes'),(29,0,'comment_moderation','0','yes'),(30,0,'moderation_notify','1','yes'),(31,0,'permalink_structure','/%year%/%monthnum%/%day%/%postname%/','yes'),(32,0,'gzipcompression','0','yes'),(33,0,'hack_file','0','yes'),(34,0,'blog_charset','UTF-8','yes'),(35,0,'moderation_keys','','no'),(36,0,'active_plugins','a:0:{}','yes'),(37,0,'home','http://example.com/bar','yes'),(38,0,'category_base','','yes'),(39,0,'ping_sites','http://rpc.pingomatic.com/','yes'),(40,0,'advanced_edit','0','yes'),(41,0,'comment_max_links','2','yes'),(42,0,'gmt_offset','0','yes'),(43,0,'default_email_category','1','yes'),(44,0,'recently_edited','','no'),(45,0,'template','twentyeleven','yes'),(46,0,'stylesheet','twentyeleven','yes'),(47,0,'comment_whitelist','1','yes'),(48,0,'blacklist_keys','','no'),(49,0,'comment_registration','0','yes'),(50,0,'rss_language','en','yes'),(51,0,'html_type','text/html','yes'),(52,0,'use_trackback','0','yes'),(53,0,'default_role','subscriber','yes'),(54,0,'db_version','19470','yes'),(55,0,'uploads_use_yearmonth_folders','1','yes'),(56,0,'upload_path','wp-content/blogs.dir/3/files','yes'),(57,0,'blog_public','1','yes'),(58,0,'default_link_category','2','yes'),(59,0,'show_on_front','posts','yes'),(60,0,'tag_base','','yes'),(61,0,'show_avatars','1','yes'),(62,0,'avatar_rating','G','yes'),(63,0,'upload_url_path','','yes'),(64,0,'thumbnail_size_w','150','yes'),(65,0,'thumbnail_size_h','150','yes'),(66,0,'thumbnail_crop','1','yes'),(67,0,'medium_size_w','300','yes'),(68,0,'medium_size_h','300','yes'),(69,0,'avatar_default','mystery','yes'),(70,0,'enable_app','0','yes'),(71,0,'enable_xmlrpc','0','yes'),(72,0,'large_size_w','1024','yes'),(73,0,'large_size_h','1024','yes'),(74,0,'image_default_link_type','file','yes'),(75,0,'image_default_size','','yes'),(76,0,'image_default_align','','yes'),(77,0,'close_comments_for_old_posts','0','yes'),(78,0,'close_comments_days_old','14','yes'),(79,0,'thread_comments','1','yes'),(80,0,'thread_comments_depth','5','yes'),(81,0,'page_comments','0','yes'),(82,0,'comments_per_page','50','yes'),(83,0,'default_comments_page','newest','yes'),(84,0,'comment_order','asc','yes'),(85,0,'sticky_posts','a:0:{}','yes'),(86,0,'widget_categories','a:0:{}','yes'),(87,0,'widget_text','a:0:{}','yes'),(88,0,'widget_rss','a:0:{}','yes'),(89,0,'timezone_string','','yes'),(90,0,'embed_autourls','1','yes'),(91,0,'embed_size_w','','yes'),(92,0,'embed_size_h','600','yes'),(93,0,'page_for_posts','0','yes'),(94,0,'page_on_front','0','yes'),(95,0,'default_post_format','0','yes'),(96,0,'fileupload_url','http://example.com/bar/files','yes'),(97,0,'WPLANG','','yes'),(99,0,'widget_search','a:2:{i:2;a:1:{s:5:\"title\";s:0:\"\";}s:12:\"_multiwidget\";i:1;}','yes'),(100,0,'widget_recent-posts','a:2:{i:2;a:2:{s:5:\"title\";s:0:\"\";s:6:\"number\";i:5;}s:12:\"_multiwidget\";i:1;}','yes'),(101,0,'widget_recent-comments','a:2:{i:2;a:2:{s:5:\"title\";s:0:\"\";s:6:\"number\";i:5;}s:12:\"_multiwidget\";i:1;}','yes'),(102,0,'widget_archives','a:2:{i:2;a:3:{s:5:\"title\";s:0:\"\";s:5:\"count\";i:0;s:8:\"dropdown\";i:0;}s:12:\"_multiwidget\";i:1;}','yes'),(103,0,'widget_meta','a:2:{i:2;a:1:{s:5:\"title\";s:0:\"\";}s:12:\"_multiwidget\";i:1;}','yes'),(104,0,'can_compress_scripts','1','yes'),(106,0,'current_theme','Twenty Eleven','yes'),(107,0,'initial_db_version','19470','yes'),(110,0,'bio','Bacon ipsum dolor sit amet strip steak t-bone sint occaecat aliqua rump id tri-tip ut leberkas esse biltong beef spare ribs. Chuck in drumstick swine mollit anim occaecat ball tip sint veniam velit venison tri-tip laborum.','yes'),(111,0,'name','Bacon Lover','yes'),(112,0,'location','Sydney','yes'),(113,0,'twitter','bacon','yes'),(114,0,'facebook','www.facebook.com/republicofbacon','yes'),(115,0,'email','bacon@gmail.com','yes'),(116,0,'instagram','bacon','yes'),(117,0,'tumblr','bacon','yes'),(118,0,'pinterest','bacon','yes'),(119,0,'googleplus','117770524699304223125','yes'),(120,0,'youtube','bacon','yes'),(121,0,'bloglovin','www.bloglovin.com/blog/4137997/oracle-fox','yes'),(122,0,'fixtures','1','yes'),(123,0,'pinterest_pins','1','yes');

CREATE TABLE IF NOT EXISTS `wp_3_postmeta` (
  `meta_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint(20) unsigned NOT NULL DEFAULT '0',
  `meta_key` varchar(255) DEFAULT NULL,
  `meta_value` longtext,
  PRIMARY KEY (`meta_id`),
  KEY `post_id` (`post_id`),
  KEY `meta_key` (`meta_key`)
);

REPLACE INTO `wp_3_postmeta` VALUES (1,1,'frontpage-post-type','Featured'),(2,1,'_thumbnail_id','100001'),(3,1,'orientation','top'),(4,1,'original_title','Dolor sit amet meatball'),(7,2,'frontpage-post-type','Portrait'),(8,2,'_thumbnail_id','100000'),(9,2,'orientation',''),(10,2,'original_title','Tongue brewsaola'),(13,3,'frontpage-post-type','Video'),(14,3,'_thumbnail_id','100001'),(15,3,'orientation','top'),(16,3,'original_title','Flank hamburger');

CREATE TABLE IF NOT EXISTS `wp_3_posts` (
  `ID` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `post_author` bigint(20) unsigned NOT NULL DEFAULT '0',
  `post_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_date_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_content` longtext NOT NULL,
  `post_title` text NOT NULL,
  `post_excerpt` text NOT NULL,
  `post_status` varchar(20) NOT NULL DEFAULT 'publish',
  `comment_status` varchar(20) NOT NULL DEFAULT 'open',
  `ping_status` varchar(20) NOT NULL DEFAULT 'open',
  `post_password` varchar(20) NOT NULL DEFAULT '',
  `post_name` varchar(200) NOT NULL DEFAULT '',
  `to_ping` text NOT NULL,
  `pinged` text NOT NULL,
  `post_modified` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_modified_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_content_filtered` text NOT NULL,
  `post_parent` bigint(20) unsigned NOT NULL DEFAULT '0',
  `guid` varchar(255) NOT NULL DEFAULT '',
  `menu_order` int(11) NOT NULL DEFAULT '0',
  `post_type` varchar(20) NOT NULL DEFAULT 'post',
  `post_mime_type` varchar(100) NOT NULL DEFAULT '',
  `comment_count` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  KEY `post_name` (`post_name`),
  KEY `type_status_date` (`post_type`,`post_status`,`post_date`,`ID`),
  KEY `post_parent` (`post_parent`),
  KEY `post_author` (`post_author`)
);

REPLACE INTO `wp_3_posts` VALUES (1,0,'2012-11-18 00:10:00','2012-11-18 00:00:00','Shankle brisket pancetta leberkas. Bresaola sirloin pork chop ribeye beef ribs, pork loin ham hock meatball bacon tail pork jowl drumstick turducken corned beef. Cow drumstick sausage filet mignon speck fatback pork loin. Jerky meatloaf capicola short ribs drumstick. Corned beef rump fatback ham speck swine, sirloin bresaola jowl shankle ham hock beef. Salami chicken biltong fatback, ham shankle kielbasa shoulder bacon turducken hamburger corned beef boudin short ribs.<br /><img src=\"/bar/files/2011/01/1.jpg\" /><br /><img src=\"/bar/files/2011/01/1.jpg\" title=\"Has anyone really been far even as?\" /><br /><img src=\"/bar/files/2011/01/1.jpg\" title=\"All your base are belong to us\" />','Dolor sit amet meatball','Has anyone really been far even as decided to use even go want to do look more like?','publish','open','open','','dolor-sit-amet-meatball','','','2013-05-21 10:40:34','2013-05-21 10:30:34','',0,'',0,'post','',0),(2,0,'2012-02-10 00:10:00','2012-02-10 00:00:00','Tri-tip ground round meatball spare ribs, pork venison speck leberkas. Bacon sirloin pork loin beef ribs beef hamburger, venison ham frankfurter biltong pork belly shoulder swine cow. Boudin tenderloin frankfurter kielbasa salami. Ground round jowl corned beef ham hock, prosciutto spare ribs pastrami drumstick chuck sausage capicola. Shank brisket bacon pork loin, sirloin meatloaf flank capicola drumstick bresaola beef short ribs. Pork strip steak pastrami, flank prosciutto chuck ribeye shoulder andouille salami. Cow swine pig jowl, meatball bresaola jerky andouille beef short loin boudin corned beef.<br /><img src=\"/bar/files/2011/01/1.jpg\" /><br /><img src=\"/bar/files/2011/01/1.jpg\" title=\"All your base are belong to us\" /><br /><img src=\"/bar/files/2011/01/2.jpg\" title=\"Has anyone really been far even as?\" />','Tongue brewsaola','Has anyone really been far even as decided to use even go want to do look more like?','publish','open','open','','tongue-brewsaola','','','2013-05-21 10:40:34','2013-05-21 10:30:34','',0,'',0,'post','',0),(3,0,'2011-07-15 00:10:00','2011-07-15 00:00:00','http://www.youtube.com/watch?v=y8Kyi0WNg40<br /><br />Capicola brisket bacon, short loin shank biltong pastrami corned beef jowl tenderloin. Drumstick brisket boudin, ribeye fatback prosciutto bresaola ham. Beef pork loin ham ribeye prosciutto, t-bone tail. Kielbasa speck boudin, jowl capicola prosciutto drumstick ribeye spare ribs turducken pork frankfurter shankle sausage ham hock. Biltong pork loin pastrami pig ham, tail tri-tip andouille bresaola rump meatloaf hamburger fatback shoulder shankle. Tongue pork short ribs, beef ribs pork chop filet mignon drumstick. Bacon leberkas ham hock pancetta, spare ribs hamburger sausage shankle jowl meatloaf t-bone kielbasa.<br /><p>Go use <a href=\"http://google.com/\">Google</a> to search for stuff, or maybe <a href=\"http://bing.com\">Bing</a></p><br /><img src=\"/bar/files/2011/01/1.jpg\" /><br /><img src=\"/bar/files/2011/01/1.jpg\" title=\"Has anyone really been far even as?\" /><br /><img src=\"/bar/files/2011/01/2.jpg\" title=\"Has anyone really been far even as?\" />','Flank hamburger','Has anyone really been far even as decided to use even go want to do look more like?','publish','open','open','','flank-hamburger','','','2013-05-21 10:40:34','2013-05-21 10:30:34','',0,'',0,'post','',0),(100000,0,'2013-05-21 10:40:34','2013-05-21 10:30:34','','','','publish','open','open','','','','','2013-05-21 10:40:34','2013-05-21 10:30:34','',0,'/bar/files/2011/01/1.jpg',0,'attachment','',0),(100001,0,'2013-05-21 10:40:34','2013-05-21 10:30:34','','','','publish','open','open','','','','','2013-05-21 10:40:34','2013-05-21 10:30:34','',0,'/bar/files/2011/01/2.jpg',0,'attachment','',0);

CREATE TABLE IF NOT EXISTS `wp_3_term_relationships` (
  `object_id` bigint(20) unsigned NOT NULL DEFAULT '0',
  `term_taxonomy_id` bigint(20) unsigned NOT NULL DEFAULT '0',
  `term_order` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`object_id`,`term_taxonomy_id`),
  KEY `term_taxonomy_id` (`term_taxonomy_id`)
);

TRUNCATE wp_3_term_relationships;

INSERT INTO `wp_3_term_relationships` VALUES (1,2,0),(1,3,0),(1,4,0),(1,5,0),(2,5,0),(2,6,0),(2,7,0),(3,2,0),(3,4,0),(3,5,0),(3,10,0);

CREATE TABLE IF NOT EXISTS `wp_3_term_taxonomy` (
  `term_taxonomy_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `term_id` bigint(20) unsigned NOT NULL DEFAULT '0',
  `taxonomy` varchar(32) NOT NULL DEFAULT '',
  `description` longtext NOT NULL,
  `parent` bigint(20) unsigned NOT NULL DEFAULT '0',
  `count` bigint(20) NOT NULL DEFAULT '0',
  PRIMARY KEY (`term_taxonomy_id`),
  UNIQUE KEY `term_id_taxonomy` (`term_id`,`taxonomy`),
  KEY `taxonomy` (`taxonomy`)
);

TRUNCATE wp_3_term_taxonomy;

INSERT INTO `wp_3_term_taxonomy` VALUES (1,1,'category','',0,0),(2,2,'category','',0,0),(3,3,'category','',0,0),(4,4,'post_tag','',0,0),(5,5,'post_tag','',0,0),(6,6,'category','',0,0),(7,7,'category','',0,0),(10,10,'category','',0,0);

CREATE TABLE IF NOT EXISTS `wp_3_terms` (
  `term_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL DEFAULT '',
  `slug` varchar(200) NOT NULL DEFAULT '',
  `term_group` bigint(10) NOT NULL DEFAULT '0',
  PRIMARY KEY (`term_id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `name` (`name`)
);

TRUNCATE wp_3_terms;

INSERT INTO `wp_3_terms` VALUES (1,'Uncategorized','uncategorized',0),(2,'Advertorial','advertorial',0),(3,'Personal','personal',0),(4,'Awesome','awesome',0),(5,'Radical','radical',0),(6,'News','news',0),(7,'Photography','photography',0),(10,'Travel','travel',0);

CREATE TABLE IF NOT EXISTS `wp_blogs` (
  `blog_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `site_id` bigint(20) NOT NULL DEFAULT '0',
  `domain` varchar(200) NOT NULL DEFAULT '',
  `path` varchar(100) NOT NULL DEFAULT '',
  `registered` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `last_updated` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `public` tinyint(2) NOT NULL DEFAULT '1',
  `archived` enum('0','1') NOT NULL DEFAULT '0',
  `mature` tinyint(2) NOT NULL DEFAULT '0',
  `spam` tinyint(2) NOT NULL DEFAULT '0',
  `deleted` tinyint(2) NOT NULL DEFAULT '0',
  `lang_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`blog_id`),
  KEY `domain` (`domain`(50),`path`(5)),
  KEY `lang_id` (`lang_id`)
);

REPLACE INTO `wp_blogs` VALUES (1,1,'example.com','/','2012-03-14 22:52:22','0000-00-00 00:00:00',1,'0',0,0,0,0),(2,1,'example.com','/foo/','0000-00-00 00:00:00','0000-00-00 00:00:00',1,'0',0,0,0,0),(3,1,'example.com','/bar/','0000-00-00 00:00:00','0000-00-00 00:00:00',1,'0',0,0,0,0);

