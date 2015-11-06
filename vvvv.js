// VVVV.js -- Visual Webclient Programming
// (c) 2011 Matthias Zauner
// VVVV.js is freely distributable under the MIT license.
// Additional authors of sub components are mentioned at the specific code locations.


(function() {

/** @define {string} */
VVVV_ENV = 'development';

// some prerequisites ...
/*$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
  if ( options.dataType == 'script' || originalOptions.dataType == 'script' ) {
      options.cache = true;
  }
});*/

/*if(!window.console) {
  window.console = {
    log : function(str) {
    }
  };
}*/

var aliases = {
  jquery: 'lib/jquery/jquery-1.8.2.min',
  d3: 'lib/d3-v3/d3.v3.min',
  underscore: 'lib/underscore/underscore',
  glMatrix: 'lib/glMatrix-0.9.5.min',
}

var VVVVBrowserContext = {};

/**
 * Adds the neccessary JavaScripts to the head, calls the callback once everything is in place. Also automatically loads patches specified in script tags.
 * @param {String} path_to_vvvv points to the folder of your vvvv.js. This is relative to your html-file
 * @param {String} mode. Can be either "full", "vvvviewer" or "run". Depends on what you want to do
 * @param {Function} callback will be called once all the scripts and initialisations have been finished.
 */
VVVVBrowserContext.init = function (path_to_vvvv, mode, callback) {
  VVVVContext.Root = path_to_vvvv || './';

  requirejs.config({
    baseUrl: path_to_vvvv,
    paths: aliases,
    shim: {
      'glMatrix': {
        exports: 'exports'
      }
    }
  })

  if (VVVV_ENV=='development') console.log('loading vvvv.js ...');

  require(['core/vvvv.core', 'jquery'], function(vvvv, $) {
    initialisationComplete(vvvv, $);
  });

  function initialisationComplete(VVVV, $) {
    VVVVContext.MainLoops = [];

    $("link[rel='VVVV'], script[language='VVVV']").each(function(i) {
      var href_attribute = 'href';
      if ($(this).get(0).tagName=='SCRIPT') {
        if (VVVV_ENV=='development') console.warn('DEPRECATED: loading patches via <script language="VVVV" src="..."> tag is deprecated. Use <link rel="VVVV" href="..."> instead.');
        href_attribute = 'src';
      }
      var p = new VVVV.Patch($(this).attr(href_attribute), function() {
        var m = new VVVV.MainLoop(this);
        VVVVContext.MainLoops.push(m);
      });
      VVVVContext.Patches[i] = p;
    });

    if (typeof callback === 'function') callback.call(window, VVVV);
  }
};

VVVVBrowserContext.loadFile = function(filename, opts) {
  opts = opts || {};
  $.ajax({
    url: filename,
    type: 'get',
    dataType: 'text',
    success: opts.success,
    error: opts.success
  })
}

VVVVBrowserContext.getRelativeRequire = function(system_require) {
  return system_require;
}


var VVVVNodeContext = {};

VVVVNodeContext.init = function (path_to_vvvv, mode, callback) {
  VVVVContext.Root = path_to_vvvv || './';
  var path = require('path');
  VVVVContext.AppRoot = path.resolve(path.dirname(process.mainModule.filename));
  VVVVContext.Root = VVVVContext.AppRoot+'/'+VVVVContext.Root;
  var jsdom = require(VVVVContext.Root+'/node_modules/jsdom');
  jsdom.env('<html></html>', function(err, w) {
    global.window = w;
    var vvvv = require(VVVVContext.Root+'/core/vvvv.core');
    if (typeof callback === 'function') callback.call(window, vvvv);
  });
}

VVVVNodeContext.loadFile = function(filename, opts) {
  var data;
  try {
    data = require('fs').readFileSync(VVVVContext.AppRoot+'/'+filename, {encoding: 'utf-8'});
    if (typeof opts.success === 'function')
      opts.success.call(window, data);
  } catch (e) {
    if (typeof opts.error === 'function')
      opts.error.call();
  }
}

VVVVNodeContext.getRelativeRequire = function(system_require) {
  return function(b) {
    var p = b;
    if (aliases[p])
      p = aliases[p];
    if (p[0]=='.')
      return system_require(p);
    else
      return system_require(VVVVContext.Root+'/'+p);
  }
}

if (typeof define==='function') // Browser with require.js
  VVVVContext = VVVVBrowserContext;
else
  VVVVContext = VVVVNodeContext;

/**
 * This holds all created patches and their subpatches. Indices are the absolute patch file names. Patches that are loaded with the script tag are
 * also stored in indices 0 .. n
 */
VVVVContext.Patches = {};

/**
 * Fired when framerate is lower than 15fps for a certain amount of frames. See VVVV.MainLoop#update
 */
VVVVContext.onLowFrameRate = function() {

}

/**
 * Fired when a node is being created that is not implemented
 * @param {String} nodename the name of the node which is not implemented
 */
VVVVContext.onNotImplemented = function(nodename) {
  console.log("Warning: "+nodename+" is not implemented.");
};

}());
