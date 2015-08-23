(function () {/**
 * almond 0.2.6 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    function onResourceLoad(name, defined, deps){
        if(requirejs.onResourceLoad && name){
            requirejs.onResourceLoad({defined:defined}, {id:name}, deps);
        }
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }

        onResourceLoad(name, defined, args);
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../Scripts/almond-custom", function(){});

define('durandal/system',["require","jquery"],function(e,t){function n(e){var t="[object "+e+"]";r["is"+e]=function(e){return s.call(e)==t}}var r,a=!1,i=Object.keys,o=Object.prototype.hasOwnProperty,s=Object.prototype.toString,l=!1,c=Array.isArray,d=Array.prototype.slice;if(String.prototype.trim||(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")}),Function.prototype.bind&&("object"==typeof console||"function"==typeof console)&&"object"==typeof console.log)try{["log","info","warn","error","assert","dir","clear","profile","profileEnd"].forEach(function(e){console[e]=this.call(console[e],console)},Function.prototype.bind)}catch(u){l=!0}e.on&&e.on("moduleLoaded",function(e,t){r.setModuleId(e,t)}),"undefined"!=typeof requirejs&&(requirejs.onResourceLoad=function(e,t){r.setModuleId(e.defined[t.id],t.id)});var p=function(){},m=function(){try{if("undefined"!=typeof console&&"function"==typeof console.log)if(window.opera)for(var e=0;e<arguments.length;)console.log("Item "+(e+1)+": "+arguments[e]),e++;else 1==d.call(arguments).length&&"string"==typeof d.call(arguments)[0]?console.log(d.call(arguments).toString()):console.log.apply(console,d.call(arguments));else Function.prototype.bind&&!l||"undefined"==typeof console||"object"!=typeof console.log||Function.prototype.call.call(console.log,console,d.call(arguments))}catch(t){}},f=function(e,t){var n;n=e instanceof Error?e:new Error(e),n.innerError=t;try{"undefined"!=typeof console&&"function"==typeof console.error?console.error(n):Function.prototype.bind&&!l||"undefined"==typeof console||"object"!=typeof console.error||Function.prototype.call.call(console.error,console,n)}catch(r){}throw n};r={version:"2.1.0",noop:p,getModuleId:function(e){return e?"function"==typeof e&&e.prototype?e.prototype.__moduleId__:"string"==typeof e?null:e.__moduleId__:null},setModuleId:function(e,t){return e?"function"==typeof e&&e.prototype?(e.prototype.__moduleId__=t,void 0):("string"!=typeof e&&(e.__moduleId__=t),void 0):void 0},resolveObject:function(e){return r.isFunction(e)?new e:e},debug:function(e){return 1==arguments.length&&(a=e,a?(this.log=m,this.error=f,this.log("Debug:Enabled")):(this.log("Debug:Disabled"),this.log=p,this.error=p)),a},log:p,error:p,assert:function(e,t){e||r.error(new Error(t||"Assert:Failed"))},defer:function(e){return t.Deferred(e)},guid:function(){var e=(new Date).getTime();return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(t){var n=0|(e+16*Math.random())%16;return e=Math.floor(e/16),("x"==t?n:8|7&n).toString(16)})},acquire:function(){var t,n=arguments[0],a=!1;return r.isArray(n)?(t=n,a=!0):t=d.call(arguments,0),this.defer(function(n){e(t,function(){var e=arguments;setTimeout(function(){e.length>1||a?n.resolve(d.call(e,0)):n.resolve(e[0])},1)},function(e){n.reject(e)})}).promise()},extend:function(e){for(var t=d.call(arguments,1),n=0;n<t.length;n++){var r=t[n];if(r)for(var a in r)e[a]=r[a]}return e},wait:function(e){return r.defer(function(t){setTimeout(t.resolve,e)}).promise()}},r.keys=i||function(e){if(e!==Object(e))throw new TypeError("Invalid object");var t=[];for(var n in e)o.call(e,n)&&(t[t.length]=n);return t},r.isElement=function(e){return!(!e||1!==e.nodeType)},r.isArray=c||function(e){return"[object Array]"==s.call(e)},r.isObject=function(e){return e===Object(e)},r.isBoolean=function(e){return"boolean"==typeof e},r.isPromise=function(e){return e&&r.isFunction(e.then)};for(var v=["Arguments","Function","String","Number","Date","RegExp"],g=0;g<v.length;g++)n(v[g]);return r});
define('durandal/viewEngine',["durandal/system","jquery"],function(e,t){var n;return n=t.parseHTML?function(e){return t.parseHTML(e)}:function(e){return t(e).get()},{cache:{},viewExtension:".html",viewPlugin:"text",viewPluginParameters:"",isViewUrl:function(e){return-1!==e.indexOf(this.viewExtension,e.length-this.viewExtension.length)},convertViewUrlToViewId:function(e){return e.substring(0,e.length-this.viewExtension.length)},convertViewIdToRequirePath:function(e){var t=this.viewPlugin?this.viewPlugin+"!":"";return t+e+this.viewExtension+this.viewPluginParameters},parseMarkup:n,processMarkup:function(e){var t=this.parseMarkup(e);return this.ensureSingleElement(t)},ensureSingleElement:function(e){if(1==e.length)return e[0];for(var n=[],r=0;r<e.length;r++){var a=e[r];if(8!=a.nodeType){if(3==a.nodeType){var i=/\S/.test(a.nodeValue);if(!i)continue}n.push(a)}}return n.length>1?t(n).wrapAll('<div class="durandal-wrapper"></div>').parent().get(0):n[0]},tryGetViewFromCache:function(e){return this.cache[e]},putViewInCache:function(e,t){this.cache[e]=t},createView:function(t){var n=this,r=this.convertViewIdToRequirePath(t),a=this.tryGetViewFromCache(r);return a?e.defer(function(e){e.resolve(a.cloneNode(!0))}).promise():e.defer(function(a){e.acquire(r).then(function(e){var i=n.processMarkup(e);i.setAttribute("data-view",t),n.putViewInCache(r,i),a.resolve(i.cloneNode(!0))}).fail(function(e){n.createFallbackView(t,r,e).then(function(e){e.setAttribute("data-view",t),n.cache[r]=e,a.resolve(e.cloneNode(!0))})})}).promise()},createFallbackView:function(t,n){var r=this,a='View Not Found. Searched for "'+t+'" via path "'+n+'".';return e.defer(function(e){e.resolve(r.processMarkup('<div class="durandal-view-404">'+a+"</div>"))}).promise()}}});
define('durandal/viewLocator',["durandal/system","durandal/viewEngine"],function(e,t){function n(e,t){for(var n=0;n<e.length;n++){var r=e[n],a=r.getAttribute("data-view");if(a==t)return r}}function r(e){return(e+"").replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g,"\\$1")}return{useConvention:function(e,t,n){e=e||"viewmodels",t=t||"views",n=n||t;var a=new RegExp(r(e),"gi");this.convertModuleIdToViewId=function(e){return e.replace(a,t)},this.translateViewIdToArea=function(e,t){return t&&"partial"!=t?n+"/"+t+"/"+e:n+"/"+e}},locateViewForObject:function(t,n,r){var a;if(t.getView&&(a=t.getView()))return this.locateView(a,n,r);if(t.viewUrl)return this.locateView(t.viewUrl,n,r);var i=e.getModuleId(t);return i?this.locateView(this.convertModuleIdToViewId(i),n,r):this.locateView(this.determineFallbackViewId(t),n,r)},convertModuleIdToViewId:function(e){return e},determineFallbackViewId:function(e){var t=/function (.{1,})\(/,n=t.exec(e.constructor.toString()),r=n&&n.length>1?n[1]:"";return r=r.trim(),"views/"+r},translateViewIdToArea:function(e){return e},locateView:function(r,a,i){if("string"==typeof r){var o;if(o=t.isViewUrl(r)?t.convertViewUrlToViewId(r):r,a&&(o=this.translateViewIdToArea(o,a)),i){var s=n(i,o);if(s)return e.defer(function(e){e.resolve(s)}).promise()}return t.createView(o)}return e.defer(function(e){e.resolve(r)}).promise()}}});
define('durandal/binder',["durandal/system","knockout"],function(e,t){function n(t){return void 0===t?{applyBindings:!0}:e.isBoolean(t)?{applyBindings:t}:(void 0===t.applyBindings&&(t.applyBindings=!0),t)}function r(r,d,c,u){if(!d||!c)return a.throwOnErrors?e.error(i):e.log(i,d,u),void 0;if(!d.getAttribute)return a.throwOnErrors?e.error(o):e.log(o,d,u),void 0;var m=d.getAttribute("data-view");try{var p;return r&&r.binding&&(p=r.binding(d)),p=n(p),a.binding(u,d,p),p.applyBindings?(e.log("Binding",m,u),t.applyBindings(c,d)):r&&t.utils.domData.set(d,l,{$data:r}),a.bindingComplete(u,d,p),r&&r.bindingComplete&&r.bindingComplete(d),t.utils.domData.set(d,s,p),p}catch(f){f.message=f.message+";\nView: "+m+";\nModuleId: "+e.getModuleId(u),a.throwOnErrors?e.error(f):e.log(f.message)}}var a,i="Insufficient Information to Bind",o="Unexpected View Type",s="durandal-binding-instruction",l="__ko_bindingContext__";return a={binding:e.noop,bindingComplete:e.noop,throwOnErrors:!1,getBindingInstruction:function(e){return t.utils.domData.get(e,s)},bindContext:function(e,t,n,a){return n&&e&&(e=e.createChildContext(n,"string"==typeof a?a:null)),r(n,t,e,n||(e?e.$data:null))},bind:function(e,t){return r(e,t,e,e)}}});
define('durandal/activator',["durandal/system","knockout"],function(e,t){function n(t){return void 0==t&&(t={}),e.isBoolean(t.closeOnDeactivate)||(t.closeOnDeactivate=d.defaults.closeOnDeactivate),t.beforeActivate||(t.beforeActivate=d.defaults.beforeActivate),t.afterDeactivate||(t.afterDeactivate=d.defaults.afterDeactivate),t.affirmations||(t.affirmations=d.defaults.affirmations),t.interpretResponse||(t.interpretResponse=d.defaults.interpretResponse),t.areSameItem||(t.areSameItem=d.defaults.areSameItem),t.findChildActivator||(t.findChildActivator=d.defaults.findChildActivator),t}function r(t,n,r){return e.isArray(r)?t[n].apply(t,r):t[n](r)}function a(t,n,r,a,i){if(t&&t.deactivate){e.log("Deactivating",t);var o;try{o=t.deactivate(n)}catch(s){return e.log("ERROR: "+s.message,s),a.resolve(!1),void 0}o&&o.then?o.then(function(){r.afterDeactivate(t,n,i),a.resolve(!0)},function(t){e.log(t),a.resolve(!1)}):(r.afterDeactivate(t,n,i),a.resolve(!0))}else t&&r.afterDeactivate(t,n,i),a.resolve(!0)}function i(t,n,a,i){var o;if(t&&t.activate){e.log("Activating",t);try{o=r(t,"activate",i)}catch(s){return e.log("ERROR: "+s.message,s),a(!1),void 0}}o&&o.then?o.then(function(){n(t),a(!0)},function(t){e.log("ERROR: "+t.message,t),a(!1)}):(n(t),a(!0))}function o(t,n,r,a){return a=e.extend({},c,a),r.lifecycleData=null,e.defer(function(i){function o(){if(t&&t.canDeactivate&&a.canDeactivate){var o;try{o=t.canDeactivate(n)}catch(s){return e.log("ERROR: "+s.message,s),i.resolve(!1),void 0}o.then?o.then(function(e){r.lifecycleData=e,i.resolve(r.interpretResponse(e))},function(t){e.log("ERROR: "+t.message,t),i.resolve(!1)}):(r.lifecycleData=o,i.resolve(r.interpretResponse(o)))}else i.resolve(!0)}var s=r.findChildActivator(t);s?s.canDeactivate().then(function(e){e?o():i.resolve(!1)}):o()}).promise()}function s(t,n,a,i,o){return a.lifecycleData=null,e.defer(function(s){if(a.areSameItem(n(),t,i,o))return s.resolve(!0),void 0;if(t&&t.canActivate){var l;try{l=r(t,"canActivate",o)}catch(d){return e.log("ERROR: "+d.message,d),s.resolve(!1),void 0}l.then?l.then(function(e){a.lifecycleData=e,s.resolve(a.interpretResponse(e))},function(t){e.log("ERROR: "+t.message,t),s.resolve(!1)}):(a.lifecycleData=l,s.resolve(a.interpretResponse(l)))}else s.resolve(!0)}).promise()}function l(r,l){var d,c=t.observable(null);l=n(l);var u=t.computed({read:function(){return c()},write:function(e){u.viaSetter=!0,u.activateItem(e)}});return u.__activator__=!0,u.settings=l,l.activator=u,u.isActivating=t.observable(!1),u.forceActiveItem=function(e){c(e)},u.canDeactivateItem=function(e,t,n){return o(e,t,l,n)},u.deactivateItem=function(t,n){return e.defer(function(e){u.canDeactivateItem(t,n).then(function(r){r?a(t,n,l,e,c):(u.notifySubscribers(),e.resolve(!1))})}).promise()},u.canActivateItem=function(e,t){return s(e,c,l,d,t)},u.activateItem=function(t,n,r){var o=u.viaSetter;return u.viaSetter=!1,e.defer(function(s){if(u.isActivating())return s.resolve(!1),void 0;u.isActivating(!0);var m=c();return l.areSameItem(m,t,d,n)?(u.isActivating(!1),s.resolve(!0),void 0):(u.canDeactivateItem(m,l.closeOnDeactivate,r).then(function(r){r?u.canActivateItem(t,n).then(function(r){r?e.defer(function(e){a(m,l.closeOnDeactivate,l,e)}).promise().then(function(){t=l.beforeActivate(t,n),i(t,c,function(e){d=n,u.isActivating(!1),s.resolve(e)},n)}):(o&&u.notifySubscribers(),u.isActivating(!1),s.resolve(!1))}):(o&&u.notifySubscribers(),u.isActivating(!1),s.resolve(!1))}),void 0)}).promise()},u.canActivate=function(){var e;return r?(e=r,r=!1):e=u(),u.canActivateItem(e)},u.activate=function(){var e;return r?(e=r,r=!1):e=u(),u.activateItem(e)},u.canDeactivate=function(e){return u.canDeactivateItem(u(),e)},u.deactivate=function(e){return u.deactivateItem(u(),e)},u.includeIn=function(e){e.canActivate=function(){return u.canActivate()},e.activate=function(){return u.activate()},e.canDeactivate=function(e){return u.canDeactivate(e)},e.deactivate=function(e){return u.deactivate(e)}},l.includeIn?u.includeIn(l.includeIn):r&&u.activate(),u.forItems=function(t){l.closeOnDeactivate=!1,l.determineNextItemToActivate=function(e,t){var n=t-1;return-1==n&&e.length>1?e[1]:n>-1&&n<e.length-1?e[n]:null},l.beforeActivate=function(e){var n=u();if(e){var r=t.indexOf(e);-1==r?t.push(e):e=t()[r]}else e=l.determineNextItemToActivate(t,n?t.indexOf(n):0);return e},l.afterDeactivate=function(e,n){n&&t.remove(e)};var n=u.canDeactivate;u.canDeactivate=function(r){return r?e.defer(function(e){function n(){for(var t=0;t<i.length;t++)if(!i[t])return e.resolve(!1),void 0;e.resolve(!0)}for(var a=t(),i=[],o=0;o<a.length;o++)u.canDeactivateItem(a[o],r).then(function(e){i.push(e),i.length==a.length&&n()})}).promise():n()};var r=u.deactivate;return u.deactivate=function(n){return n?e.defer(function(e){function r(r){setTimeout(function(){u.deactivateItem(r,n).then(function(){i++,t.remove(r),i==o&&e.resolve()})},1)}for(var a=t(),i=0,o=a.length,s=0;o>s;s++)r(a[s])}).promise():r()},u},u}var d,c={canDeactivate:!0},u={closeOnDeactivate:!0,affirmations:["yes","ok","true"],interpretResponse:function(n){return e.isObject(n)&&(n=n.can||!1),e.isString(n)?-1!==t.utils.arrayIndexOf(this.affirmations,n.toLowerCase()):n},areSameItem:function(e,t){return e==t},beforeActivate:function(e){return e},afterDeactivate:function(e,t,n){t&&n&&n(null)},findChildActivator:function(){return null}};return d={defaults:u,create:l,isActivator:function(e){return e&&e.__activator__}}});
define('durandal/composition',["durandal/system","durandal/viewLocator","durandal/binder","durandal/viewEngine","durandal/activator","jquery","knockout"],function(e,t,n,r,a,i,o){function s(t,n,r){try{if(t.onError)try{t.onError(n,r)}catch(a){e.error(a)}else e.error(n)}finally{d(t,r,!0)}}function l(e){for(var t=[],n={childElements:t,activeView:null},r=o.virtualElements.firstChild(e);r;)1==r.nodeType&&(t.push(r),r.getAttribute(k)&&(n.activeView=r)),r=o.virtualElements.nextSibling(r);return n.activeView||(n.activeView=t[0]),n}function d(e,t,n){if(x--,0===x){var r=A;A=[],n||setTimeout(function(){for(var n=r.length;n--;)try{r[n]()}catch(a){s(e,a,t)}},1)}c(e)}function c(e){delete e.activeView,delete e.viewElements}function u(t,n,r,a){if(r)n();else if(t.activate&&t.model&&t.model.activate){var i;try{i=e.isArray(t.activationData)?t.model.activate.apply(t.model,t.activationData):t.model.activate(t.activationData),i&&i.then?i.then(n,function(e){s(t,e,a),n()}):i||void 0===i?n():d(t,a)}catch(o){s(t,o,a)}}else n()}function m(t,n){var t=this;if(t.activeView&&t.activeView.removeAttribute(k),t.child)try{t.model&&t.model.attached&&(t.composingNewView||t.alwaysTriggerAttach)&&t.model.attached(t.child,t.parent,t),t.attached&&t.attached(t.child,t.parent,t),t.child.setAttribute(k,!0),t.composingNewView&&t.model&&t.model.detached&&o.utils.domNodeDisposal.addDisposeCallback(t.child,function(){try{t.model.detached(t.child,t.parent,t)}catch(e){s(t,e,n)}})}catch(r){s(t,r,n)}t.triggerAttach=e.noop}function p(t){if(e.isString(t.transition)){if(t.activeView){if(t.activeView==t.child)return!1;if(!t.child)return!0;if(t.skipTransitionOnSameViewId){var n=t.activeView.getAttribute("data-view"),r=t.child.getAttribute("data-view");return n!=r}}return!0}return!1}function f(e){for(var t=0,n=e.length,r=[];n>t;t++){var a=e[t].cloneNode(!0);r.push(a)}return r}function v(t){var n=f(t.parts),r=w.getParts(n),a=w.getParts(t.child);for(var o in r){var s=a[o];s||(s=i('[data-part="'+o+'"]',t.child).get(0))?s.parentNode.replaceChild(r[o],s):e.log("Could not find part to override: "+o)}}function h(t){var n,r,a=o.virtualElements.childNodes(t.parent);if(!e.isArray(a)){var i=[];for(n=0,r=a.length;r>n;n++)i[n]=a[n];a=i}for(n=1,r=a.length;r>n;n++)o.removeNode(a[n])}function g(e){o.utils.domData.set(e,D,e.style.display),e.style.display="none"}function y(e){var t=o.utils.domData.get(e,D);e.style.display="none"===t?"block":t}function b(e){var t=e.getAttribute("data-bind");if(!t)return!1;for(var n=0,r=C.length;r>n;n++)if(t.indexOf(C[n])>-1)return!0;return!1}var w,I={},k="data-active-view",A=[],x=0,T="durandal-composition-data",S="data-part",E=["model","view","transition","area","strategy","activationData","onError"],D="durandal-visibility-data",C=["compose:"],N={complete:function(e){A.push(e)}};return w={composeBindings:C,convertTransitionToModuleId:function(e){return"transitions/"+e},defaultTransitionName:null,current:N,addBindingHandler:function(e,t,n){var r,a,i="composition-handler-"+e;t=t||o.bindingHandlers[e],n=n||function(){return void 0},a=o.bindingHandlers[e]={init:function(e,r,a,s,l){if(x>0){var d={trigger:o.observable(null)};w.current.complete(function(){t.init&&t.init(e,r,a,s,l),t.update&&(o.utils.domData.set(e,i,t),d.trigger("trigger"))}),o.utils.domData.set(e,i,d)}else o.utils.domData.set(e,i,t),t.init&&t.init(e,r,a,s,l);return n(e,r,a,s,l)},update:function(e,t,n,r,a){var s=o.utils.domData.get(e,i);return s.update?s.update(e,t,n,r,a):(s.trigger&&s.trigger(),void 0)}};for(r in t)"init"!==r&&"update"!==r&&(a[r]=t[r])},getParts:function(e,t){if(t=t||{},!e)return t;void 0===e.length&&(e=[e]);for(var n=0,r=e.length;r>n;n++){var a,i=e[n];i.getAttribute&&(a=i.getAttribute(S),a&&(t[a]=i),i.hasChildNodes()&&!b(i)&&w.getParts(i.childNodes,t))}return t},cloneNodes:f,finalize:function(t,r){if(void 0===t.transition&&(t.transition=this.defaultTransitionName),t.child||t.activeView)if(p(t)){var a=this.convertTransitionToModuleId(t.transition);e.acquire(a).then(function(e){t.transition=e,e(t).then(function(){if(t.cacheViews){if(t.activeView){var e=n.getBindingInstruction(t.activeView);e&&void 0!=e.cacheViews&&!e.cacheViews?o.removeNode(t.activeView):g(t.activeView)}}else t.child?h(t):o.virtualElements.emptyNode(t.parent);t.child&&y(t.child),t.triggerAttach(t,r),d(t,r)})}).fail(function(e){s(t,"Failed to load transition ("+a+"). Details: "+e.message,r)})}else{if(t.child!=t.activeView){if(t.cacheViews&&t.activeView){var i=n.getBindingInstruction(t.activeView);!i||void 0!=i.cacheViews&&!i.cacheViews?o.removeNode(t.activeView):g(t.activeView)}t.child?(t.cacheViews||h(t),y(t.child)):t.cacheViews||o.virtualElements.emptyNode(t.parent)}t.triggerAttach(t,r),d(t,r)}else t.cacheViews||o.virtualElements.emptyNode(t.parent),t.triggerAttach(t,r),d(t,r)},bindAndShow:function(e,t,a,i){a.child=e,a.parent.__composition_context=a,a.composingNewView=a.cacheViews?-1==o.utils.arrayIndexOf(a.viewElements,e):!0,u(a,function(){if(a.parent.__composition_context==a){if(delete a.parent.__composition_context,a.binding&&a.binding(a.child,a.parent,a),a.preserveContext&&a.bindingContext)a.composingNewView&&(a.parts&&v(a),g(e),o.virtualElements.prepend(a.parent,e),n.bindContext(a.bindingContext,e,a.model,a.as));else if(e){var i=a.model||I,s=o.dataFor(e);if(s!=i){if(!a.composingNewView)return o.removeNode(e),r.createView(e.getAttribute("data-view")).then(function(e){w.bindAndShow(e,t,a,!0)}),void 0;a.parts&&v(a),g(e),o.virtualElements.prepend(a.parent,e),n.bind(i,e)}}w.finalize(a,t)}else d(a,t)},i,t)},defaultStrategy:function(e){return t.locateViewForObject(e.model,e.area,e.viewElements)},getSettings:function(t){var n,i=t(),s=o.utils.unwrapObservable(i)||{},l=a.isActivator(i);if(e.isString(s))return s=r.isViewUrl(s)?{view:s}:{model:s,activate:!l};if(n=e.getModuleId(s))return s={model:s,activate:!l};!l&&s.model&&(l=a.isActivator(s.model));for(var d in s)s[d]=-1!=o.utils.arrayIndexOf(E,d)?o.utils.unwrapObservable(s[d]):s[d];return l?s.activate=!1:void 0===s.activate&&(s.activate=!0),s},executeStrategy:function(e,t){e.strategy(e).then(function(n){w.bindAndShow(n,t,e)})},inject:function(n,r){return n.model?n.view?(t.locateView(n.view,n.area,n.viewElements).then(function(e){w.bindAndShow(e,r,n)}),void 0):(n.strategy||(n.strategy=this.defaultStrategy),e.isString(n.strategy)?e.acquire(n.strategy).then(function(e){n.strategy=e,w.executeStrategy(n,r)}).fail(function(e){s(n,"Failed to load view strategy ("+n.strategy+"). Details: "+e.message,r)}):this.executeStrategy(n,r),void 0):(this.bindAndShow(null,r,n),void 0)},compose:function(n,r,a,i){x++,i||(r=w.getSettings(function(){return r},n)),r.compositionComplete&&A.push(function(){r.compositionComplete(r.child,r.parent,r)}),A.push(function(){r.composingNewView&&r.model&&r.model.compositionComplete&&r.model.compositionComplete(r.child,r.parent,r)});var o=l(n);r.activeView=o.activeView,r.parent=n,r.triggerAttach=m,r.bindingContext=a,r.cacheViews&&!r.viewElements&&(r.viewElements=o.childElements),r.model?e.isString(r.model)?e.acquire(r.model).then(function(t){r.model=e.resolveObject(t),w.inject(r,n)}).fail(function(e){s(r,"Failed to load composed module ("+r.model+"). Details: "+e.message,n)}):w.inject(r,n):r.view?(r.area=r.area||"partial",r.preserveContext=!0,t.locateView(r.view,r.area,r.viewElements).then(function(e){w.bindAndShow(e,n,r)})):this.bindAndShow(null,n,r)}},o.bindingHandlers.compose={init:function(){return{controlsDescendantBindings:!0}},update:function(e,t,n,a,i){var s=w.getSettings(t,e);if(s.mode){var l=o.utils.domData.get(e,T);if(!l){var d=o.virtualElements.childNodes(e);l={},"inline"===s.mode?l.view=r.ensureSingleElement(d):"templated"===s.mode&&(l.parts=f(d)),o.virtualElements.emptyNode(e),o.utils.domData.set(e,T,l)}"inline"===s.mode?s.view=l.view.cloneNode(!0):"templated"===s.mode&&(s.parts=l.parts),s.preserveContext=!0}w.compose(e,s,i,!0)}},o.virtualElements.allowedBindings.compose=!0,w});
define('durandal/events',["durandal/system"],function(e){var t=/\s+/,n=function(){},r=function(e,t){this.owner=e,this.events=t};return r.prototype.then=function(e,t){return this.callback=e||this.callback,this.context=t||this.context,this.callback?(this.owner.on(this.events,this.callback,this.context),this):this},r.prototype.on=r.prototype.then,r.prototype.off=function(){return this.owner.off(this.events,this.callback,this.context),this},n.prototype.on=function(e,n,a){var i,o,s;if(n){for(i=this.callbacks||(this.callbacks={}),e=e.split(t);o=e.shift();)s=i[o]||(i[o]=[]),s.push(n,a);return this}return new r(this,e)},n.prototype.off=function(n,r,a){var i,o,s,l;if(!(o=this.callbacks))return this;if(!(n||r||a))return delete this.callbacks,this;for(n=n?n.split(t):e.keys(o);i=n.shift();)if((s=o[i])&&(r||a))for(l=s.length-2;l>=0;l-=2)r&&s[l]!==r||a&&s[l+1]!==a||s.splice(l,2);else delete o[i];return this},n.prototype.trigger=function(e){var n,r,a,i,o,s,l,d;if(!(r=this.callbacks))return this;for(d=[],e=e.split(t),i=1,o=arguments.length;o>i;i++)d[i-1]=arguments[i];for(;n=e.shift();){if((l=r.all)&&(l=l.slice()),(a=r[n])&&(a=a.slice()),a)for(i=0,o=a.length;o>i;i+=2)a[i].apply(a[i+1]||this,d);if(l)for(s=[n].concat(d),i=0,o=l.length;o>i;i+=2)l[i].apply(l[i+1]||this,s)}return this},n.prototype.proxy=function(e){var t=this;return function(n){t.trigger(e,n)}},n.includeIn=function(e){e.on=n.prototype.on,e.off=n.prototype.off,e.trigger=n.prototype.trigger,e.proxy=n.prototype.proxy},n});
define('durandal/app',["durandal/system","durandal/viewEngine","durandal/composition","durandal/events","jquery"],function(e,t,n,r,a){function i(){return e.defer(function(t){return 0==s.length?(t.resolve(),void 0):(e.acquire(s).then(function(n){for(var r=0;r<n.length;r++){var a=n[r];if(a.install){var i=l[r];e.isObject(i)||(i={}),a.install(i),e.log("Plugin:Installed "+s[r])}else e.log("Plugin:Loaded "+s[r])}t.resolve()}).fail(function(t){e.error("Failed to load plugin(s). Details: "+t.message)}),void 0)}).promise()}var o,s=[],l=[];return o={title:"Application",configurePlugins:function(t,n){var r=e.keys(t);n=n||"plugins/",-1===n.indexOf("/",n.length-1)&&(n+="/");for(var a=0;a<r.length;a++){var i=r[a];s.push(n+i),l.push(t[i])}},start:function(){return e.log("Application:Starting"),this.title&&(document.title=this.title),e.defer(function(t){a(function(){i().then(function(){t.resolve(),e.log("Application:Started")})})}).promise()},setRoot:function(r,a,i){function o(){if(l.model)if(l.model.canActivate)try{var t=l.model.canActivate();t&&t.then?t.then(function(e){e&&n.compose(s,l)}).fail(function(t){e.error(t)}):t&&n.compose(s,l)}catch(r){e.error(r)}else n.compose(s,l);else n.compose(s,l)}var s,l={activate:!0,transition:a};s=!i||e.isString(i)?document.getElementById(i||"applicationHost"):i,e.isString(r)?t.isViewUrl(r)?l.view=r:l.model=r:l.model=r,e.isString(l.model)?e.acquire(l.model).then(function(t){l.model=e.resolveObject(t),o()}).fail(function(t){e.error("Failed to load root module ("+l.model+"). Details: "+t.message)}):o()}},r.includeIn(o),o});
define('services/config',[],function(){var e={activeStatusTypeId:1,alwaysRefreshMetadata:!1,currentCycleYear:2015,logOutCounterSeconds:1170,metadataRefreshMeasure:"weeks",metadataRefreshPeriod:1,trHighPercentIncreaseThreshold:.06,trLowPercentIncreaseThreshold:.01,highPercentIncreaseThreshold:.03,lowPercentIncreaseThreshold:.01,meritAdjustmentTypeIdIndicatesNotReviewed:1,siteUrl:"/",userInfoUrl:"/api/account/getUserInfo",remoteServiceName:"/breeze/data",appointmentTypesUrl:"appointmentTypes",baseSalaryAdjustmentsUrl:"baseSalaryAdjustments",departmentNamesForPerson:"/api/person/getDepartmentNames",departmentsUrl:"departments",employmentsUrl:"employments",extendSessionUrl:"/api/session/extend",facultyTypesUrl:"facultyTypes",leaveTypesUrl:"leaveTypes",getAssignableRolesUrl:"/api/role/getAssignableRoles",logOutUrl:"/cas/logOut",lookupsUrl:"getLookups",manageableUnitsUrl:"getManageableUnits",meritAdjustmentTypesUrl:"meritAdjustmentTypes",personsUrl:"persons",personsWithMultipleEmploymentsUrl:"/api/report/getPersonsWithMultipleEmployments",rankTypesUrl:"rankTypes",rolesUrl:"getRoles",roleAssignmentsUrl:"roleAssignments",salariesUrl:"salaries",salariesByFacultyTypeUrl:"/api/report/getSalariesByFacultyType",specialAdjustmentTypesUrl:"specialAdjustmentTypes",specialSalaryAdjustmentsUrl:"specialSalaryAdjustments",statusTypesUrl:"statusTypes",unitsUrl:"units",usersByDepartment:"/api/user/getByDepartmentalAccess",usersUrl:"users"};return e});
define('services/entitymanagerprovider',["durandal/app","services/config"],function(e,t){function n(){return new s}function r(){return Q.fcall(a).then(function(){l.modelBuilder&&l.modelBuilder(o.metadataStore);var e=breeze.EntityQuery.from(t.lookupsUrl);return o.executeQuery(e)}).fail(function(e){console.log(e)})}function a(){if(Modernizr.localstorage){var e=localStorage.getObject("metadata");if(e){if(!(moment().diff(e.lastSaveDate,t.metadataRefreshMeasure)>t.metadataRefreshPeriod||t.alwaysRefreshMetadata))return o.metadataStore.importMetadata(e.rawMetadata);localStorage.removeItem("metadata")}return o.fetchMetadata().then(function(){var e=moment().format(),t=o.metadataStore.exportMetadata();localStorage.setObject("metadata",{lastSaveDate:e,rawMetadata:t})})}return o.fetchMetadata()}breeze.NamingConvention.camelCase.setAsDefault();var i=(breeze.config.getAdapterInstance("ajax"),t.remoteServiceName),o=new breeze.EntityManager({serviceName:i}),s=function(){var t=function(){var t;this.manager=function(){return t||(t=o.createEmptyCopy(),t.importEntities(o.exportEntities()),t.hasChangesChanged.subscribe(function(){e.trigger("hasChanges")})),t}};return t}(),l={prepare:r,create:n};return l});
define('services/repository',[],function(){function e(e,n,r,a){return new t(e,n,r,a)}var t=function(){var e=function(e,t,n,r){function a(t){return e.manager().executeQuery(t.using(r||breeze.FetchStrategy.FromServer)).then(function(e){return e.results})}function i(t){return e.manager().executeQueryLocally(t)}function o(){return s().metadataStore}function s(){return e.manager()}function l(e,t){if(!e.entityType||e.entityType.shortName!==t)throw new Error("Object must be an entity of type "+t)}var d;t&&(d=o().getEntityType(t),d.setProperties({defaultResourceName:n}),o().setEntityTypeForResourceName(n,t)),this.withId=function(e){if(!t)throw new Error("Repository must be created with an entity type specified");return s().fetchEntityByKey(t,e,!0)},this.find=function(e,t){var r;return r=t?breeze.EntityQuery.from(n).where(e).expand(t):breeze.EntityQuery.from(n).where(e),a(r)},this.count=function(t){var a;return a=breeze.EntityQuery.from(n).where(t).take(0).inlineCount(),e.manager().executeQuery(a.using(r||breeze.FetchStrategy.FromServer)).then(function(e){return e.inlineCount})},this.select=function(e,t){var r=breeze.EntityQuery.from(n).where(e).select(t);return a(r)},this.findInCache=function(e){var t=breeze.EntityQuery.from(n).where(e);return i(t)},this.all=function(){var e=breeze.EntityQuery.from(n);return a(e)},this.create=function(e){console.log("Creating entity: "+t);var n=s().createEntity(t,e);return n},this.delete=function(e){return l(e,t),e.entityAspect.setDeleted(e)}};return e}();return{create:e,getCtor:t}});
define('services/logger',["durandal/system"],function(e){function t(e,t,n,r){a(e,t,n,r,"info")}function n(e,t,n,r){a(e,t,n,r,"error")}function r(e,t,n,r){a(e,t,n,r,"success")}function a(t,n,r,a,i){r=r?"["+r+"] ":"",n?e.log(r,t,n):e.log(r,t),a&&("error"===i?toastr.error(t):toastr.info(t))}var i={log:t,logError:n,logSuccess:r};return i});
define('services/unitofwork',["services/entitymanagerprovider","services/repository","durandal/app","services/config","services/logger"],function(e,t,n,r,a){function i(){return new d}function o(e){return l[e]||(l[e]=new c),l[e]}function s(){for(var e in l)0===l[e].referenceCount&&delete l[e]}var l={},d=function(){var i=function(){var i=e.create();this.hasChanges=function(){return i.manager().hasChanges()},this.commit=function(){var e=new breeze.SaveOptions({resourceName:r.saveChangesUrl});return i.manager().saveChanges(null,e).then(function(e){n.trigger("saved",e.entities)}).fail(function(e){var t="Save failed: "+breeze.saveErrorMessageService.getErrorMessage(e);throw e.message=t,a.logError(t,null,null,!0),e})},this.rollback=function(){return i.manager().rejectChanges()},this.appointmentTypes=t.create(i,"AppointmentType",r.appointmentTypesUrl,breeze.FetchStrategy.FromLocalCache),this.baseSalaryAdjustments=t.create(i,"Salary",r.baseSalaryAdjustmentsUrl),this.departments=t.create(i,"Department",r.departmentsUrl,breeze.FetchStrategy.FromLocalCache),this.employments=t.create(i,"Employment",r.employmentsUrl),this.facultyTypes=t.create(i,"FacultyType",r.facultyTypesUrl,breeze.FetchStrategy.FromLocalCache),this.leaveTypes=t.create(i,"LeaveType",r.leaveTypesUrl,breeze.FetchStrategy.FromLocalCache),this.manageableUnits=t.create(i,"Unit",r.manageableUnitsUrl),this.meritAdjustmentTypes=t.create(i,"MeritAdjustmentType",r.meritAdjustmentTypesUrl,breeze.FetchStrategy.FromLocalCache),this.persons=t.create(i,"Person",r.personsUrl),this.rankTypes=t.create(i,"RankType",r.rankTypesUrl,breeze.FetchStrategy.FromLocalCache),this.roles=t.create(i,"Role",r.rolesUrl),this.roleAssignments=t.create(i,"RoleAssignment",r.roleAssignmentsUrl),this.salaries=t.create(i,"Salary",r.salariesUrl),this.specialAdjustmentTypes=t.create(i,"SpecialAdjustmentType",r.specialAdjustmentTypesUrl,breeze.FetchStrategy.FromLocalCache),this.specialSalaryAdjustments=t.create(i,"SpecialSalaryAdjustment",r.specialSalaryAdjustmentsUrl),this.statusTypes=t.create(i,"StatusType",r.statusTypesUrl,breeze.FetchStrategy.FromLocalCache),this.units=t.create(i,"Unit",r.unitsUrl,breeze.FetchStrategy.FromLocalCache),this.users=t.create(i,"User",r.usersUrl),this.departmentNamesForPerson=function(e){return $.ajax({type:"GET",url:r.departmentNamesForPerson+"/"+e,cache:!1,dataType:"json"})},this.getAssignableRoles=function(){return $.ajax({type:"GET",url:r.getAssignableRolesUrl,cache:!1,dataType:"json"})},this.personsWithMultipleEmployments=function(e){return $.ajax({type:"GET",url:r.personsWithMultipleEmploymentsUrl+"/"+e,cache:!1,dataType:"json"})},this.salariesByFacultyType=function(e){return $.ajax({type:"GET",url:r.salariesByFacultyTypeUrl+"/"+e,cache:!1,dataType:"json"})},this.usersByDepartment=function(e){return $.ajax({type:"GET",url:r.usersByDepartment+"/"+e,cache:!1,dataType:"json"})}};return i}(),c=function(){var e=function(){var e=null;this.referenceCount=0,this.value=function(){return null===e&&(e=new d),this.referenceCount++,e},this.clear=function(){e=null,this.referenceCount=0,s()}};return e.prototype.release=function(){this.referenceCount--,0===this.referenceCount&&this.clear()},e}();return{create:i,get:o}});
define('global/session',["services/unitofwork"],function(e){function r(e){if(e){i.userName(e.userName);var r=e.userRoles.split(",");$.each(r,function(e,r){i.userRoles.push(r)}),i.isLoggedIn(!0)}}function o(){i.userName(""),i.userRoles.removeAll(),i.isLoggedIn(!1)}function s(e){return void 0===e?!0:void 0===i.userRoles()?!1:$.isArray(e)?0===e.length?!0:$.arrayIntersect(i.userRoles(),e).length>0:$.inArray(e,i.userRoles())>-1}function n(){i.unitofwork(e.create())}var i={isLoggedIn:ko.observable(!1),unitofwork:ko.observable(),userName:ko.observable(void 0),clearUser:o,initUnitOfWork:n,setUser:r,userIsInRole:s,userRoles:ko.observableArray()};return i});
(function () {
    var AjaxMonitor, Bar, DocumentMonitor, ElementMonitor, ElementTracker, EventLagMonitor, Evented, Events, NoTargetError, RequestIntercept, SOURCE_KEYS, Scaler, SocketRequestTracker, XHRRequestTracker, animation, avgAmplitude, bar, cancelAnimation, cancelAnimationFrame, defaultOptions, extend, extendNative, getFromDOM, getIntercept, handlePushState, ignoreStack, init, now, options, requestAnimationFrame, result, runAnimation, scalers, shouldIgnoreURL, shouldTrack, source, sources, uniScaler, _WebSocket, _XDomainRequest, _XMLHttpRequest, _i, _intercept, _len, _pushState, _ref, _ref1, _replaceState,
      __slice = [].slice,
      __hasProp = {}.hasOwnProperty,
      __extends = function (child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
      __indexOf = [].indexOf || function (item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

    defaultOptions = {
        catchupTime: 500,
        initialRate: .03,
        minTime: 500,
        ghostTime: 500,
        maxProgressPerFrame: 10,
        easeFactor: 1.25,
        startOnPageLoad: true,
        restartOnPushState: true,
        restartOnRequestAfter: 500,
        target: 'body',
        elements: {
            checkInterval: 100,
            selectors: ['body']
        },
        eventLag: {
            minSamples: 10,
            sampleCount: 3,
            lagThreshold: 3
        },
        ajax: {
            trackMethods: ['GET', 'POST', 'PUT', 'DELETE'],
            trackWebSockets: true,
            ignoreURLs: []
        }
    };

    now = function () {
        var _ref;
        return (_ref = typeof performance !== "undefined" && performance !== null ? typeof performance.now === "function" ? performance.now() : void 0 : void 0) != null ? _ref : +(new Date);
    };

    requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

    if (requestAnimationFrame == null) {
        requestAnimationFrame = function (fn) {
            return setTimeout(fn, 50);
        };
        cancelAnimationFrame = function (id) {
            return clearTimeout(id);
        };
    }

    runAnimation = function (fn) {
        var last, tick;
        last = now();
        tick = function () {
            var diff;
            diff = now() - last;
            if (diff >= 33) {
                last = now();
                return fn(diff, function () {
                    return requestAnimationFrame(tick);
                });
            } else {
                return setTimeout(tick, 33 - diff);
            }
        };
        return tick();
    };

    result = function () {
        var args, key, obj;
        obj = arguments[0], key = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
        if (typeof obj[key] === 'function') {
            return obj[key].apply(obj, args);
        } else {
            return obj[key];
        }
    };

    extend = function () {
        var key, out, source, sources, val, _i, _len;
        out = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        for (_i = 0, _len = sources.length; _i < _len; _i++) {
            source = sources[_i];
            if (source) {
                for (key in source) {
                    if (!__hasProp.call(source, key)) continue;
                    val = source[key];
                    if ((out[key] != null) && typeof out[key] === 'object' && (val != null) && typeof val === 'object') {
                        extend(out[key], val);
                    } else {
                        out[key] = val;
                    }
                }
            }
        }
        return out;
    };

    avgAmplitude = function (arr) {
        var count, sum, v, _i, _len;
        sum = count = 0;
        for (_i = 0, _len = arr.length; _i < _len; _i++) {
            v = arr[_i];
            sum += Math.abs(v);
            count++;
        }
        return sum / count;
    };

    getFromDOM = function (key, json) {
        var data, e, el;
        if (key == null) {
            key = 'options';
        }
        if (json == null) {
            json = true;
        }
        el = document.querySelector("[data-pace-" + key + "]");
        if (!el) {
            return;
        }
        data = el.getAttribute("data-pace-" + key);
        if (!json) {
            return data;
        }
        try {
            return JSON.parse(data);
        } catch (_error) {
            e = _error;
            return typeof console !== "undefined" && console !== null ? console.error("Error parsing inline pace options", e) : void 0;
        }
    };

    Evented = (function () {
        function Evented() { }

        Evented.prototype.on = function (event, handler, ctx, once) {
            var _base;
            if (once == null) {
                once = false;
            }
            if (this.bindings == null) {
                this.bindings = {};
            }
            if ((_base = this.bindings)[event] == null) {
                _base[event] = [];
            }
            return this.bindings[event].push({
                handler: handler,
                ctx: ctx,
                once: once
            });
        };

        Evented.prototype.once = function (event, handler, ctx) {
            return this.on(event, handler, ctx, true);
        };

        Evented.prototype.off = function (event, handler) {
            var i, _ref, _results;
            if (((_ref = this.bindings) != null ? _ref[event] : void 0) == null) {
                return;
            }
            if (handler == null) {
                return delete this.bindings[event];
            } else {
                i = 0;
                _results = [];
                while (i < this.bindings[event].length) {
                    if (this.bindings[event][i].handler === handler) {
                        _results.push(this.bindings[event].splice(i, 1));
                    } else {
                        _results.push(i++);
                    }
                }
                return _results;
            }
        };

        Evented.prototype.trigger = function () {
            var args, ctx, event, handler, i, once, _ref, _ref1, _results;
            event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            if ((_ref = this.bindings) != null ? _ref[event] : void 0) {
                i = 0;
                _results = [];
                while (i < this.bindings[event].length) {
                    _ref1 = this.bindings[event][i], handler = _ref1.handler, ctx = _ref1.ctx, once = _ref1.once;
                    handler.apply(ctx != null ? ctx : this, args);
                    if (once) {
                        _results.push(this.bindings[event].splice(i, 1));
                    } else {
                        _results.push(i++);
                    }
                }
                return _results;
            }
        };

        return Evented;

    })();

    if (window.Pace == null) {
        window.Pace = {};
    }

    extend(Pace, Evented.prototype);

    options = Pace.options = extend({}, defaultOptions, window.paceOptions, getFromDOM());

    _ref = ['ajax', 'document', 'eventLag', 'elements'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        source = _ref[_i];
        if (options[source] === true) {
            options[source] = defaultOptions[source];
        }
    }

    NoTargetError = (function (_super) {
        __extends(NoTargetError, _super);

        function NoTargetError() {
            _ref1 = NoTargetError.__super__.constructor.apply(this, arguments);
            return _ref1;
        }

        return NoTargetError;

    })(Error);

    Bar = (function () {
        function Bar() {
            this.progress = 0;
        }

        Bar.prototype.getElement = function () {
            var targetElement;
            if (this.el == null) {
                targetElement = document.querySelector(options.target);
                if (!targetElement) {
                    throw new NoTargetError;
                }
                this.el = document.createElement('div');
                this.el.className = "pace pace-active";
                document.body.className = document.body.className.replace(/pace-done/g, '');
                document.body.className += ' pace-running';
                this.el.innerHTML = '<div class="pace-progress">\n  <div class="pace-progress-inner"></div>\n</div>\n<div class="pace-activity"></div>';
                if (targetElement.firstChild != null) {
                    targetElement.insertBefore(this.el, targetElement.firstChild);
                } else {
                    targetElement.appendChild(this.el);
                }
            }
            return this.el;
        };

        Bar.prototype.finish = function () {
            var el;
            el = this.getElement();
            el.className = el.className.replace('pace-active', '');
            el.className += ' pace-inactive';
            document.body.className = document.body.className.replace('pace-running', '');
            return document.body.className += ' pace-done';
        };

        Bar.prototype.update = function (prog) {
            this.progress = prog;
            return this.render();
        };

        Bar.prototype.destroy = function () {
            try {
                this.getElement().parentNode.removeChild(this.getElement());
            } catch (_error) {
                NoTargetError = _error;
            }
            return this.el = void 0;
        };

        Bar.prototype.render = function () {
            var el, progressStr;
            if (document.querySelector(options.target) == null) {
                return false;
            }
            el = this.getElement();
            el.children[0].style.width = "" + this.progress + "%";
            if (!this.lastRenderedProgress || this.lastRenderedProgress | 0 !== this.progress | 0) {
                el.children[0].setAttribute('data-progress-text', "" + (this.progress | 0) + "%");
                if (this.progress >= 100) {
                    progressStr = '99';
                } else {
                    progressStr = this.progress < 10 ? "0" : "";
                    progressStr += this.progress | 0;
                }
                el.children[0].setAttribute('data-progress', "" + progressStr);
            }
            return this.lastRenderedProgress = this.progress;
        };

        Bar.prototype.done = function () {
            return this.progress >= 100;
        };

        return Bar;

    })();

    Events = (function () {
        function Events() {
            this.bindings = {};
        }

        Events.prototype.trigger = function (name, val) {
            var binding, _j, _len1, _ref2, _results;
            if (this.bindings[name] != null) {
                _ref2 = this.bindings[name];
                _results = [];
                for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                    binding = _ref2[_j];
                    _results.push(binding.call(this, val));
                }
                return _results;
            }
        };

        Events.prototype.on = function (name, fn) {
            var _base;
            if ((_base = this.bindings)[name] == null) {
                _base[name] = [];
            }
            return this.bindings[name].push(fn);
        };

        return Events;

    })();

    _XMLHttpRequest = window.XMLHttpRequest;

    _XDomainRequest = window.XDomainRequest;

    _WebSocket = window.WebSocket;

    extendNative = function (to, from) {
        var e, key, val, _results;
        _results = [];
        for (key in from.prototype) {
            try {
                val = from.prototype[key];
                if ((to[key] == null) && typeof val !== 'function') {
                    _results.push(to[key] = val);
                } else {
                    _results.push(void 0);
                }
            } catch (_error) {
                e = _error;
            }
        }
        return _results;
    };

    ignoreStack = [];

    Pace.ignore = function () {
        var args, fn, ret;
        fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        ignoreStack.unshift('ignore');
        ret = fn.apply(null, args);
        ignoreStack.shift();
        return ret;
    };

    Pace.track = function () {
        var args, fn, ret;
        fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        ignoreStack.unshift('track');
        ret = fn.apply(null, args);
        ignoreStack.shift();
        return ret;
    };

    shouldTrack = function (method) {
        var _ref2;
        if (method == null) {
            method = 'GET';
        }
        if (ignoreStack[0] === 'track') {
            return 'force';
        }
        if (!ignoreStack.length && options.ajax) {
            if (method === 'socket' && options.ajax.trackWebSockets) {
                return true;
            } else if (_ref2 = method.toUpperCase(), __indexOf.call(options.ajax.trackMethods, _ref2) >= 0) {
                return true;
            }
        }
        return false;
    };

    RequestIntercept = (function (_super) {
        __extends(RequestIntercept, _super);

        function RequestIntercept() {
            var monitorXHR,
              _this = this;
            RequestIntercept.__super__.constructor.apply(this, arguments);
            monitorXHR = function (req) {
                var _open;
                _open = req.open;
                return req.open = function (type, url, async) {
                    if (shouldTrack(type)) {
                        _this.trigger('request', {
                            type: type,
                            url: url,
                            request: req
                        });
                    }
                    return _open.apply(req, arguments);
                };
            };
            window.XMLHttpRequest = function (flags) {
                var req;
                req = new _XMLHttpRequest(flags);
                monitorXHR(req);
                return req;
            };
            extendNative(window.XMLHttpRequest, _XMLHttpRequest);
            if (_XDomainRequest != null) {
                window.XDomainRequest = function () {
                    var req;
                    req = new _XDomainRequest;
                    monitorXHR(req);
                    return req;
                };
                extendNative(window.XDomainRequest, _XDomainRequest);
            }
            if ((_WebSocket != null) && options.ajax.trackWebSockets) {
                window.WebSocket = function (url, protocols) {
                    var req;
                    if (protocols != null) {
                        req = new _WebSocket(url, protocols);
                    } else {
                        req = new _WebSocket(url);
                    }
                    if (shouldTrack('socket')) {
                        _this.trigger('request', {
                            type: 'socket',
                            url: url,
                            protocols: protocols,
                            request: req
                        });
                    }
                    return req;
                };
                extendNative(window.WebSocket, _WebSocket);
            }
        }

        return RequestIntercept;

    })(Events);

    _intercept = null;

    getIntercept = function () {
        if (_intercept == null) {
            _intercept = new RequestIntercept;
        }
        return _intercept;
    };

    shouldIgnoreURL = function (url) {
        var pattern, _j, _len1, _ref2;
        _ref2 = options.ajax.ignoreURLs;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            pattern = _ref2[_j];
            if (typeof pattern === 'string') {
                if (url.indexOf(pattern) !== -1) {
                    return true;
                }
            } else {
                if (pattern.test(url)) {
                    return true;
                }
            }
        }
        return false;
    };

    getIntercept().on('request', function (_arg) {
        var after, args, request, type, url;
        type = _arg.type, request = _arg.request, url = _arg.url;
        if (shouldIgnoreURL(url)) {
            return;
        }
        if (!Pace.running && (options.restartOnRequestAfter !== false || shouldTrack(type) === 'force')) {
            args = arguments;
            after = options.restartOnRequestAfter || 0;
            if (typeof after === 'boolean') {
                after = 0;
            }
            return setTimeout(function () {
                var stillActive, _j, _len1, _ref2, _ref3, _results;
                if (type === 'socket') {
                    stillActive = request.readyState < 2;
                } else {
                    stillActive = (0 < (_ref2 = request.readyState) && _ref2 < 4);
                }
                if (stillActive) {
                    Pace.restart();
                    _ref3 = Pace.sources;
                    _results = [];
                    for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
                        source = _ref3[_j];
                        if (source instanceof AjaxMonitor) {
                            source.watch.apply(source, args);
                            break;
                        } else {
                            _results.push(void 0);
                        }
                    }
                    return _results;
                }
            }, after);
        }
    });

    AjaxMonitor = (function () {
        function AjaxMonitor() {
            var _this = this;
            this.elements = [];
            getIntercept().on('request', function () {
                return _this.watch.apply(_this, arguments);
            });
        }

        AjaxMonitor.prototype.watch = function (_arg) {
            var request, tracker, type, url;
            type = _arg.type, request = _arg.request, url = _arg.url;
            if (shouldIgnoreURL(url)) {
                return;
            }
            if (type === 'socket') {
                tracker = new SocketRequestTracker(request);
            } else {
                tracker = new XHRRequestTracker(request);
            }
            return this.elements.push(tracker);
        };

        return AjaxMonitor;

    })();

    XHRRequestTracker = (function () {
        function XHRRequestTracker(request) {
            var event, size, _j, _len1, _onreadystatechange, _ref2,
              _this = this;
            this.progress = 0;
            if (window.ProgressEvent != null) {
                size = null;
                request.addEventListener('progress', function (evt) {
                    if (evt.lengthComputable) {
                        return _this.progress = 100 * evt.loaded / evt.total;
                    } else {
                        return _this.progress = _this.progress + (100 - _this.progress) / 2;
                    }
                });
                _ref2 = ['load', 'abort', 'timeout', 'error'];
                for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                    event = _ref2[_j];
                    request.addEventListener(event, function () {
                        return _this.progress = 100;
                    });
                }
            } else {
                _onreadystatechange = request.onreadystatechange;
                request.onreadystatechange = function () {
                    var _ref3;
                    if ((_ref3 = request.readyState) === 0 || _ref3 === 4) {
                        _this.progress = 100;
                    } else if (request.readyState === 3) {
                        _this.progress = 50;
                    }
                    return typeof _onreadystatechange === "function" ? _onreadystatechange.apply(null, arguments) : void 0;
                };
            }
        }

        return XHRRequestTracker;

    })();

    SocketRequestTracker = (function () {
        function SocketRequestTracker(request) {
            var event, _j, _len1, _ref2,
              _this = this;
            this.progress = 0;
            _ref2 = ['error', 'open'];
            for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                event = _ref2[_j];
                request.addEventListener(event, function () {
                    return _this.progress = 100;
                });
            }
        }

        return SocketRequestTracker;

    })();

    ElementMonitor = (function () {
        function ElementMonitor(options) {
            var selector, _j, _len1, _ref2;
            if (options == null) {
                options = {};
            }
            this.elements = [];
            if (options.selectors == null) {
                options.selectors = [];
            }
            _ref2 = options.selectors;
            for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                selector = _ref2[_j];
                this.elements.push(new ElementTracker(selector));
            }
        }

        return ElementMonitor;

    })();

    ElementTracker = (function () {
        function ElementTracker(selector) {
            this.selector = selector;
            this.progress = 0;
            this.check();
        }

        ElementTracker.prototype.check = function () {
            var _this = this;
            if (document.querySelector(this.selector)) {
                return this.done();
            } else {
                return setTimeout((function () {
                    return _this.check();
                }), options.elements.checkInterval);
            }
        };

        ElementTracker.prototype.done = function () {
            return this.progress = 100;
        };

        return ElementTracker;

    })();

    DocumentMonitor = (function () {
        DocumentMonitor.prototype.states = {
            loading: 0,
            interactive: 50,
            complete: 100
        };

        function DocumentMonitor() {
            var _onreadystatechange, _ref2,
              _this = this;
            this.progress = (_ref2 = this.states[document.readyState]) != null ? _ref2 : 100;
            _onreadystatechange = document.onreadystatechange;
            document.onreadystatechange = function () {
                if (_this.states[document.readyState] != null) {
                    _this.progress = _this.states[document.readyState];
                }
                return typeof _onreadystatechange === "function" ? _onreadystatechange.apply(null, arguments) : void 0;
            };
        }

        return DocumentMonitor;

    })();

    EventLagMonitor = (function () {
        function EventLagMonitor() {
            var avg, interval, last, points, samples,
              _this = this;
            this.progress = 0;
            avg = 0;
            samples = [];
            points = 0;
            last = now();
            interval = setInterval(function () {
                var diff;
                diff = now() - last - 50;
                last = now();
                samples.push(diff);
                if (samples.length > options.eventLag.sampleCount) {
                    samples.shift();
                }
                avg = avgAmplitude(samples);
                if (++points >= options.eventLag.minSamples && avg < options.eventLag.lagThreshold) {
                    _this.progress = 100;
                    return clearInterval(interval);
                } else {
                    return _this.progress = 100 * (3 / (avg + 3));
                }
            }, 50);
        }

        return EventLagMonitor;

    })();

    Scaler = (function () {
        function Scaler(source) {
            this.source = source;
            this.last = this.sinceLastUpdate = 0;
            this.rate = options.initialRate;
            this.catchup = 0;
            this.progress = this.lastProgress = 0;
            if (this.source != null) {
                this.progress = result(this.source, 'progress');
            }
        }

        Scaler.prototype.tick = function (frameTime, val) {
            var scaling;
            if (val == null) {
                val = result(this.source, 'progress');
            }
            if (val >= 100) {
                this.done = true;
            }
            if (val === this.last) {
                this.sinceLastUpdate += frameTime;
            } else {
                if (this.sinceLastUpdate) {
                    this.rate = (val - this.last) / this.sinceLastUpdate;
                }
                this.catchup = (val - this.progress) / options.catchupTime;
                this.sinceLastUpdate = 0;
                this.last = val;
            }
            if (val > this.progress) {
                this.progress += this.catchup * frameTime;
            }
            scaling = 1 - Math.pow(this.progress / 100, options.easeFactor);
            this.progress += scaling * this.rate * frameTime;
            this.progress = Math.min(this.lastProgress + options.maxProgressPerFrame, this.progress);
            this.progress = Math.max(0, this.progress);
            this.progress = Math.min(100, this.progress);
            this.lastProgress = this.progress;
            return this.progress;
        };

        return Scaler;

    })();

    sources = null;

    scalers = null;

    bar = null;

    uniScaler = null;

    animation = null;

    cancelAnimation = null;

    Pace.running = false;

    handlePushState = function () {
        if (options.restartOnPushState) {
            return Pace.restart();
        }
    };

    if (window.history.pushState != null) {
        _pushState = window.history.pushState;
        window.history.pushState = function () {
            handlePushState();
            return _pushState.apply(window.history, arguments);
        };
    }

    if (window.history.replaceState != null) {
        _replaceState = window.history.replaceState;
        window.history.replaceState = function () {
            handlePushState();
            return _replaceState.apply(window.history, arguments);
        };
    }

    SOURCE_KEYS = {
        ajax: AjaxMonitor,
        elements: ElementMonitor,
        document: DocumentMonitor,
        eventLag: EventLagMonitor
    };

    (init = function () {
        var type, _j, _k, _len1, _len2, _ref2, _ref3, _ref4;
        Pace.sources = sources = [];
        _ref2 = ['ajax', 'elements', 'document', 'eventLag'];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            type = _ref2[_j];
            if (options[type] !== false) {
                sources.push(new SOURCE_KEYS[type](options[type]));
            }
        }
        _ref4 = (_ref3 = options.extraSources) != null ? _ref3 : [];
        for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
            source = _ref4[_k];
            sources.push(new source(options));
        }
        Pace.bar = bar = new Bar;
        scalers = [];
        return uniScaler = new Scaler;
    })();

    Pace.stop = function () {
        Pace.trigger('stop');
        Pace.running = false;
        bar.destroy();
        cancelAnimation = true;
        if (animation != null) {
            if (typeof cancelAnimationFrame === "function") {
                cancelAnimationFrame(animation);
            }
            animation = null;
        }
        return init();
    };

    Pace.restart = function () {
        Pace.trigger('restart');
        Pace.stop();
        return Pace.start();
    };

    Pace.go = function () {
        var start;
        Pace.running = true;
        bar.render();
        start = now();
        cancelAnimation = false;
        return animation = runAnimation(function (frameTime, enqueueNextFrame) {
            var avg, count, done, element, elements, i, j, remaining, scaler, scalerList, sum, _j, _k, _len1, _len2, _ref2;
            remaining = 100 - bar.progress;
            count = sum = 0;
            done = true;
            for (i = _j = 0, _len1 = sources.length; _j < _len1; i = ++_j) {
                source = sources[i];
                scalerList = scalers[i] != null ? scalers[i] : scalers[i] = [];
                elements = (_ref2 = source.elements) != null ? _ref2 : [source];
                for (j = _k = 0, _len2 = elements.length; _k < _len2; j = ++_k) {
                    element = elements[j];
                    scaler = scalerList[j] != null ? scalerList[j] : scalerList[j] = new Scaler(element);
                    done &= scaler.done;
                    if (scaler.done) {
                        continue;
                    }
                    count++;
                    sum += scaler.tick(frameTime);
                }
            }
            avg = sum / count;
            bar.update(uniScaler.tick(frameTime, avg));
            if (bar.done() || done || cancelAnimation) {
                bar.update(100);
                Pace.trigger('done');
                return setTimeout(function () {
                    bar.finish();
                    Pace.running = false;
                    return Pace.trigger('hide');
                }, Math.max(options.ghostTime, Math.max(options.minTime - (now() - start), 0)));
            } else {
                return enqueueNextFrame();
            }
        });
    };

    Pace.start = function (_options) {
        extend(options, _options);
        Pace.running = true;
        try {
            bar.render();
        } catch (_error) {
            NoTargetError = _error;
        }
        if (!document.querySelector('.pace')) {
            return setTimeout(Pace.start, 50);
        } else {
            Pace.trigger('start');
            return Pace.go();
        }
    };

    if (typeof define === 'function' && define.amd) {
        define('pace',[],function () {
            return Pace;
        });
    } else if (typeof exports === 'object') {
        module.exports = Pace;
    } else {
        if (options.startOnPageLoad) {
            Pace.start();
        }
    }

}).call(this);
requirejs.config({baseUrl:"/App",paths:{text:"../Scripts/text",durandal:"../Scripts/durandal",pace:"../Scripts/pace",plugins:"../Scripts/durandal/plugins",transitions:"../Scripts/durandal/transitions"},waitSeconds:0}),define("jquery",[],function(){return jQuery}),define("knockout",ko),define('main',["durandal/app","durandal/viewLocator","durandal/system","global/session","pace","services/logger"],function(e,t,n,r,a,i){function o(){ko.validation.init({insertMessages:!0,decorateElement:!0,errorMessageClass:"error",errorElementClass:"error"}),ko.utils.cloneNodes||(ko.utils.cloneNodes=function(e,t){for(var n=0,r=e.length,a=[];r>n;n++){var i=e[n].cloneNode(!0);a.push(t?ko.cleanNode(i):i)}return a}),ko.bindingHandlers.ifIsInRole={init:function(e){return ko.utils.domData.set(e,"__ko_withIfBindingData",{}),{controlsDescendantBindings:!0}},update:function(e,t,n,a,i){var o=ko.utils.domData.get(e,"__ko_withIfBindingData"),s=ko.utils.unwrapObservable(t()),l=r.userIsInRole(s),d=!o.savedNodes,c=d||l!==o.didDisplayOnLastUpdate,u=!1;c&&(d&&(o.savedNodes=ko.utils.cloneNodes(ko.virtualElements.childNodes(e),!0)),l?(d||ko.virtualElements.setDomNodeChildren(e,ko.utils.cloneNodes(o.savedNodes)),ko.applyBindingsToDescendants(u?u(i,s):i,e)):ko.virtualElements.emptyNode(e),o.didDisplayOnLastUpdate=l)}},ko.bindingHandlers.ifNotIsInRole={init:function(e){return ko.utils.domData.set(e,"__ko_withIfBindingData",{}),{controlsDescendantBindings:!0}},update:function(e,t,n,a,i){var o=ko.utils.domData.get(e,"__ko_withIfBindingData"),s=ko.utils.unwrapObservable(t()),l=!r.userIsInRole(s),d=!o.savedNodes,c=d||l!==o.didDisplayOnLastUpdate,u=!1;c&&(d&&(o.savedNodes=ko.utils.cloneNodes(ko.virtualElements.childNodes(e),!0)),l?(d||ko.virtualElements.setDomNodeChildren(e,ko.utils.cloneNodes(o.savedNodes)),ko.applyBindingsToDescendants(u?u(i,s):i,e)):ko.virtualElements.emptyNode(e),o.didDisplayOnLastUpdate=l)}}}n.debug(!0),e.title="FacSal",e.configurePlugins({router:!0}),e.start().then(function(){t.useConvention(),toastr.options.timeOut=5e3,toastr.options.extendedTimeOut=0,toastr.options.closeButton=!0,window.addEventListener("offline",function(){navigator.onLine||i.logError("No Internet connection",null,"main",!0)}),o(),Q.stopUnhandledRejectionTracking(),e.setRoot("viewmodels/shell")})});
define('model/modelBuilder',["services/config","knockout"],function(e,t){function n(e){r(e),a(e),i(e),o(e),s(e),l(e),d(e),c(e),u(e),m(e),p(e),f(e),v(e),h(e)}function r(e){var t=function(e){g(e),b(e)};e.registerEntityTypeCtor("AppointmentType",null,t)}function a(e){var n=function(e){g(e),b(e),e.formattedCreatedDate=t.computed(function(){return moment(e.createdDate()).format("MM/DD/YYYY")}),e.formattedStartingBaseAmount=t.observable(e.startingBaseAmount()).extend({currency:[0]}),e.formattedNewBaseAmount=t.observable(e.newBaseAmount()).extend({currency:[0]})};e.registerEntityTypeCtor("BaseSalaryAdjustment",null,n)}function i(e){var n=function(){this.id=t.observable(breeze.core.getUuid())},r=function(e){g(e),b(e)};e.registerEntityTypeCtor("Department",n,r)}function o(e){var t=function(e){g(e),b(e)};e.registerEntityTypeCtor("Employment",null,t)}function s(e){var t=function(e){g(e),b(e)};e.registerEntityTypeCtor("FacultyType",null,t)}function l(e){var t=function(e){g(e),b(e)};e.registerEntityTypeCtor("LeaveType",null,t)}function d(e){var t=function(e){g(e),b(e)};e.registerEntityTypeCtor("MeritAdjustmentType",null,t)}function c(e){var n=function(){this.id=t.observable(breeze.core.getUuid())},r=function(e){g(e),b(e)};e.registerEntityTypeCtor("Person",n,r)}function u(e){var t=function(e){g(e),b(e)};e.registerEntityTypeCtor("RankType",null,t)}function m(e){var t=function(e){g(e),b(e)};e.registerEntityTypeCtor("Role",null,t)}function p(n){var r=function(n){g(n),b(n),n.totalAmount=t.computed(function(){return n.baseAmount()+n.adminAmount()+n.eminentAmount()+n.promotionAmount()}),n.newEminentAmount=t.computed(function(){return n.eminentAmount()+n.eminentAmount()/n.totalAmount()*(n.meritIncrease()+n.specialIncrease())+n.eminentIncrease()}),n.newTotalAmount=t.computed(function(){return n.baseAmount()+(1-n.eminentAmount()/n.totalAmount())*(n.meritIncrease()+n.specialIncrease())+n.adminAmount()+n.newEminentAmount()+n.promotionAmount()}),n.meritIncrease.subscribe(function(e){e>0&&1===n.meritAdjustmentTypeId()&&n.meritAdjustmentTypeId(2)}),n.percentIncrease=t.computed(function(){return n.newTotalAmount()/n.totalAmount()-1}),n.meritPercentIncrease=t.computed({read:function(){return(100*(n.meritIncrease()/n.totalAmount())).formatNumber(2)},write:function(e){var t=n.totalAmount()*(e/100);n.formattedMeritIncrease(t)}}),n.specialPercentIncrease=t.computed({read:function(){return(100*(n.specialIncrease()/n.totalAmount())).formatNumber(2)},write:function(e){var t=n.totalAmount()*(e/100);n.formattedSpecialIncrease(t)}}),n.eminentPercentIncrease=t.computed(function(){return(100*(n.eminentIncrease()/n.totalAmount())).formatNumber(2)}),n.formattedBannerBaseAmount=t.observable(n.bannerBaseAmount()).extend({currency:[0,n.bannerBaseAmount]}),n.formattedBaseAmount=t.observable(n.baseAmount()).extend({currency:[0,n.baseAmount]}),n.formattedTotalAmount=n.totalAmount.extend({computedCurrency:[0]}),n.formattedAdminAmount=t.observable(n.adminAmount()).extend({currency:[0,n.adminAmount]}),n.formattedEminentAmount=t.observable(n.eminentAmount()).extend({currency:[0,n.eminentAmount]}),n.formattedPromotionAmount=t.observable(n.promotionAmount()).extend({currency:[0,n.promotionAmount]}),n.formattedMeritIncrease=t.observable(n.meritIncrease()).extend({currency:[0,n.meritIncrease]}),n.formattedSpecialIncrease=t.observable(n.specialIncrease()).extend({currency:[0,n.specialIncrease]}),n.formattedEminentIncrease=t.observable(n.eminentIncrease()).extend({currency:[0,n.eminentIncrease]}),n.formattedNewTotalAmount=n.newTotalAmount.extend({computedCurrency:[0]}),n.formattedPercentIncrease=n.percentIncrease.extend({percent:2}),n.isMeritAdjustmentNoteRequired=t.computed(function(){var t,r,a=n.meritIncrease()/n.totalAmount();switch(n.facultyTypeId()){case 1:case 3:t=e.trHighPercentIncreaseThreshold,r=e.trLowPercentIncreaseThreshold;break;case 2:t=e.highPercentIncreaseThreshold,r=e.lowPercentIncreaseThreshold;break;default:throw"Invalid faculty type."}var i=a>t||r>a,o=0===n.meritIncrease(),s=n.meritAdjustmentTypeId()===e.meritAdjustmentTypeIdIndicatesNotReviewed;return i&&o&&s?!1:i}),n.meritAdjustmentTypeId.extend({validation:{validator:function(t){return n.meritIncrease()>0?t>e.meritAdjustmentTypeIdIndicatesNotReviewed:t>0},message:"Choose an adjustment reason."}}),n.meritAdjustmentNote.extend({required:{onlyIf:function(){return n.isMeritAdjustmentNoteRequired()},message:"This field is required."}}),n.isSpecialAdjustmentNoteRequired=t.computed(function(){return 0!==n.specialIncrease()}),n.specialAdjustmentNote.extend({required:{onlyIf:function(){return n.isSpecialAdjustmentNoteRequired()},message:"This field is required."}}),n.specialSalaryAdjustments.extend({validation:{validator:function(e){return n.isSpecialAdjustmentNoteRequired()?e.length>0:!0},message:"Designate a special adjustment reason."}})};n.registerEntityTypeCtor("Salary",null,r)}function f(e){var t=function(e){g(e),b(e)};e.registerEntityTypeCtor("SpecialAdjustmentType",null,t)}function v(e){var t=function(e){g(e),b(e)};e.registerEntityTypeCtor("Unit",null,t)}function h(e){var n=function(e){g(e),b(e),e.formattedCreatedDate=t.computed(function(){return moment(e.createdDate()).format("MM/DD/YYYY")})};e.registerEntityTypeCtor("User",null,n)}function g(e){var t,n,r,a,i,o,s,l,d=e.entityType;if(d){for(t=0;t<d.dataProperties.length;t+=1){for(n=d.dataProperties[t],r=n.name,a=e[r],i=[],o=0;o<n.validators.length;o+=1)s=n.validators[o],l={propertyName:r,validator:function(e){var t=this.innerValidator.validate(e,{displayName:this.propertyName});return this.message=t?t.errorMessage:"",null===t},message:"",innerValidator:s},i.push(l);a.extend({validation:i})}for(t=0;t<d.foreignKeyProperties.length;t+=1){for(n=d.foreignKeyProperties[t],r=n.name,a=e[r],i=[],o=0;o<n.validators.length;o+=1)s=n.validators[o],l={propertyName:r,validator:function(e){var t=this.innerValidator.validate(e,{displayName:this.propertyName});return this.message=t?t.errorMessage:"",null===t},message:"",innerValidator:s},i.push(l);a.extend({validation:i}),n.isNullable||a.extend({notEqual:y})}}}function b(e){var n=t.observable(!1),r=function(){var t=e.entityAspect.getValidationErrors().length>0;n()===t?n.valueHasMutated():n(t)};r(),e.entityAspect.validationErrorsChanged.subscribe(r),e.hasValidationErrors=n}var y=0,w={extendMetadata:n};return w});
define('services/utils',[],function(){function e(e){return decodeURI((RegExp(e+"="+"(.+?)(&|$)").exec(location.href)||[,null])[1])}function t(e){1===e.nodeType&&$(e).addClass("animated fadeInLeft")}function n(e){1===e.nodeType&&($(e).addClass("animated fadeOutLeft"),setTimeout(function(){$(e).remove()},500))}function r(){return moment.utc().format()}function a(e){try{var t=e.entityErrors[0];return"Validation Error: "+t.errorMessage}catch(n){return"Save validation error"}}function i(e){try{var t=e.entityAspect.getValidationErrors(),n=t.map(function(e){return e.errorMessage});return n.length?n.join("; "):"no validation errors"}catch(r){return"not an entity"}}return{getUrlParameter:e,addItemAnimation:t,removeItemAnimation:n,getCurrentDate:r,getSaveValidationErrorMessage:a,getEntityValidationErrorMessage:i}});
define('services/errorhandler',["services/logger","durandal/system","services/utils"],function(e,t,n){function r(e){return $.extend(e,new a(e))}var a=function(){var r=function(r){this.handleError=function(a){return a.entityErrors&&(a.message=n.getSaveValidationErrorMessage(a)),e.logError(a.message,null,t.getModuleId(r),!0)},this.log=function(n,a){e.log(n,null,t.getModuleId(r),a)},this.handlevalidationerrors=function(t){var n,r=[];try{n=$.parseJSON(t.responseText)}catch(a){n=null}if(n&&n.message){if(n.modelState)for(var i in n.modelState)if(r=n.modelState[i],r.length)for(var o=0;o<r.length;o++)e.logError(r[o],null,r,!0);0===r.length&&e.logError(n.message,null,n,!0)}},this.handleauthenticationerrors=function(t){if(""!==t.responseText){var n=$.parseJSON(t.responseText);n&&n.error_description?e.logError(n.error_description,null,t,!0):n.message&&e.logError(n.message,null,t,!0)}}};return r}();return{includeIn:r}});
define('services/security',["services/config"],function(e){function t(){return $.ajax(n,{cache:!1})}var n=e.userInfoUrl,r={getUserInfo:t};return $.ajaxPrefilter(function(e,t,n){n.failJSON=function(e){n.fail(function(t,n){var r;try{r=$.parseJSON(t.responseText)}catch(a){r=null}e(r,n,t)})}}),r});
define('services/sorter',[],function(){function e(e,t,n){n?e.sort(function(e,n){return e[t]()===n[t]()?0:e[t]()<n[t]()?-1:1}):e.sort(function(e,n){return e[t]()===n[t]()?0:e[t]()>n[t]()?-1:1})}var t={sort:e};return t});
define('plugins/history',["durandal/system","jquery"],function(e,t){function n(e,t,n){if(n){var r=e.href.replace(/(javascript:|#).*$/,"");s.history.replaceState?s.history.replaceState({},document.title,r+"#"+t):e.replace(r+"#"+t)}else e.hash="#"+t}var r=/^[#\/]|\s+$/g,a=/^\/+|\/+$/g,i=/msie [\w.]+/,o=/\/$/,s={interval:50,active:!1};return"undefined"!=typeof window&&(s.location=window.location,s.history=window.history),s.getHash=function(e){var t=(e||s).location.href.match(/#(.*)$/);return t?t[1]:""},s.getFragment=function(e,t){if(null==e)if(s._hasPushState||!s._wantsHashChange||t){e=s.location.pathname+s.location.search;var n=s.root.replace(o,"");e.indexOf(n)||(e=e.substr(n.length))}else e=s.getHash();return e.replace(r,"")},s.activate=function(n){s.active&&e.error("History has already been activated."),s.active=!0,s.options=e.extend({},{root:"/"},s.options,n),s.root=s.options.root,s._wantsHashChange=s.options.hashChange!==!1,s._wantsPushState=!!s.options.pushState,s._hasPushState=!!(s.options.pushState&&s.history&&s.history.pushState);var o=s.getFragment(),l=document.documentMode,d=i.exec(navigator.userAgent.toLowerCase())&&(!l||7>=l);s.root=("/"+s.root+"/").replace(a,"/"),d&&s._wantsHashChange&&(s.iframe=t('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow,s.navigate(o,!1)),s._hasPushState?t(window).on("popstate",s.checkUrl):s._wantsHashChange&&"onhashchange"in window&&!d?t(window).on("hashchange",s.checkUrl):s._wantsHashChange&&(s._checkUrlInterval=setInterval(s.checkUrl,s.interval)),s.fragment=o;var c=s.location,u=c.pathname.replace(/[^\/]$/,"$&/")===s.root;if(s._wantsHashChange&&s._wantsPushState){if(!s._hasPushState&&!u)return s.fragment=s.getFragment(null,!0),s.location.replace(s.root+s.location.search+"#"+s.fragment),!0;s._hasPushState&&u&&c.hash&&(this.fragment=s.getHash().replace(r,""),this.history.replaceState({},document.title,s.root+s.fragment+c.search))}return s.options.silent?void 0:s.loadUrl(n.startRoute)},s.deactivate=function(){t(window).off("popstate",s.checkUrl).off("hashchange",s.checkUrl),clearInterval(s._checkUrlInterval),s.active=!1},s.checkUrl=function(){var e=s.getFragment();return e===s.fragment&&s.iframe&&(e=s.getFragment(s.getHash(s.iframe))),e===s.fragment?!1:(s.iframe&&s.navigate(e,!1),s.loadUrl(),void 0)},s.loadUrl=function(e){var t=s.fragment=s.getFragment(e);return s.options.routeHandler?s.options.routeHandler(t):!1},s.navigate=function(t,r){if(!s.active)return!1;if(void 0===r?r={trigger:!0}:e.isBoolean(r)&&(r={trigger:r}),t=s.getFragment(t||""),s.fragment!==t){s.fragment=t;var a=s.root+t;if(""===t&&"/"!==a&&(a=a.slice(0,-1)),s._hasPushState)s.history[r.replace?"replaceState":"pushState"]({},document.title,a);else{if(!s._wantsHashChange)return s.location.assign(a);n(s.location,t,r.replace),s.iframe&&t!==s.getFragment(s.getHash(s.iframe))&&(r.replace||s.iframe.document.open().close(),n(s.iframe.location,t,r.replace))}return r.trigger?s.loadUrl(t):void 0}},s.navigateBack=function(){s.history.back()},s});
define('plugins/router',["durandal/system","durandal/app","durandal/activator","durandal/events","durandal/composition","plugins/history","knockout","jquery"],function(e,t,n,r,a,i,o,s){function l(e){return e=e.replace(y,"\\$&").replace(v,"(?:$1)?").replace(g,function(e,t){return t?e:"([^/]+)"}).replace(h,"(.*?)"),new RegExp("^"+e+"$",w?void 0:"i")}function c(e){var t=e.indexOf(":"),n=t>0?t-1:e.length;return e.substring(0,n)}function d(e,t){return-1!==e.indexOf(t,e.length-t.length)}function u(e,t){if(!e||!t)return!1;if(e.length!=t.length)return!1;for(var n=0,r=e.length;r>n;n++)if(e[n]!=t[n])return!1;return!0}function p(e){return e.queryString?e.fragment+"?"+e.queryString:e.fragment}var m,f,v=/\((.*?)\)/g,g=/(\(\?)?:\w+/g,h=/\*\w+/g,y=/[\-{}\[\]+?.,\\\^$|#\s]/g,b=/\/$/,w=!1,I="/",k="/",x=function(){function a(e,t){return e.router&&e.router.parent==t}function s(e){P&&P.config.isActive&&P.config.isActive(e)}function v(t,n,r){e.log("Navigation Complete",t,n);var i=e.getModuleId(j);i&&_.trigger("router:navigation:from:"+i),j=t,s(!1),P=n,s(!0);var o=e.getModuleId(j);switch(o&&_.trigger("router:navigation:to:"+o),a(t,_)||_.updateDocumentTitle(t,n),r){case"rootRouter":I=p(P);break;case"rootRouterWithChild":k=p(P);break;case"lastChildRouter":I=k}f.explicitNavigation=!1,f.navigatingBack=!1,_.trigger("router:navigation:complete",t,n,_)}function h(t,n){e.log("Navigation Cancelled"),_.activeInstruction(P),_.navigate(I,!1),O(!1),f.explicitNavigation=!1,f.navigatingBack=!1,_.trigger("router:navigation:cancelled",t,n,_)}function y(t){e.log("Navigation Redirecting"),O(!1),f.explicitNavigation=!1,f.navigatingBack=!1,_.navigate(t,{trigger:!0,replace:!0})}function w(t,n,r){f.navigatingBack=!f.explicitNavigation&&j!=r.fragment,_.trigger("router:route:activating",n,r,_);var i={canDeactivate:!_.parent};t.activateItem(n,r.params,i).then(function(e){if(e){var i=j,o=a(n,_),s="";if(_.parent?o||(s="lastChildRouter"):s=o?"rootRouterWithChild":"rootRouter",v(n,r,s),o){n.router.trigger("router:route:before-child-routes",n,r,_);var l=r.fragment;r.queryString&&(l+="?"+r.queryString),n.router.loadUrl(l)}i==n&&(_.attached(),_.compositionComplete())}else t.settings.lifecycleData&&t.settings.lifecycleData.redirect?y(t.settings.lifecycleData.redirect):h(n,r);m&&(m.resolve(),m=null)}).fail(function(t){e.error(t)})}function A(t,n,r){var a=_.guardRoute(n,r);a||""===a?a.then?a.then(function(a){a?e.isString(a)?y(a):w(t,n,r):h(n,r)}):e.isString(a)?y(a):w(t,n,r):h(n,r)}function T(e,t,n){_.guardRoute?A(e,t,n):w(e,t,n)}function S(e){return P&&P.config.moduleId==e.config.moduleId&&j&&(j.canReuseForRoute&&j.canReuseForRoute.apply(j,e.params)||!j.canReuseForRoute&&j.router&&j.router.loadUrl)}function E(){if(!O()){var t=U.shift();if(U=[],t)if(O(!0),_.activeInstruction(t),_.trigger("router:navigation:processing",t,_),S(t)){var r=n.create();r.forceActiveItem(j),r.settings.areSameItem=V.settings.areSameItem,r.settings.findChildActivator=V.settings.findChildActivator,T(r,j,t)}else t.config.moduleId?e.acquire(t.config.moduleId).then(function(n){var r=e.resolveObject(n);t.config.viewUrl&&(r.viewUrl=t.config.viewUrl),T(V,r,t)}).fail(function(n){e.error("Failed to load routed module ("+t.config.moduleId+"). Details: "+n.message,n)}):T(V,{viewUrl:t.config.viewUrl,canReuseForRoute:function(){return!0}},t)}}function C(e){U.unshift(e),E()}function D(e,t,n){for(var r=e.exec(t).slice(1),a=0;a<r.length;a++){var i=r[a];r[a]=i?decodeURIComponent(i):null}var o=_.parseQueryString(n);return o&&r.push(o),{params:r,queryParams:o}}function M(t){_.trigger("router:route:before-config",t,_),e.isRegExp(t.route)?t.routePattern=t.route:(t.title=t.title||_.convertRouteToTitle(t.route),t.viewUrl||(t.moduleId=t.moduleId||_.convertRouteToModuleId(t.route)),t.hash=t.hash||_.convertRouteToHash(t.route),t.hasChildRoutes&&(t.route=t.route+"*childRoutes"),t.routePattern=l(t.route)),t.isActive=t.isActive||o.observable(!1),_.trigger("router:route:after-config",t,_),_.routes.push(t),_.route(t.routePattern,function(e,n){var r=D(t.routePattern,e,n);C({fragment:e,queryString:n,config:t,params:r.params,queryParams:r.queryParams})})}function N(t){if(e.isArray(t.route))for(var n=t.isActive||o.observable(!1),r=0,a=t.route.length;a>r;r++){var i=e.extend({},t);i.route=t.route[r],i.isActive=n,r>0&&delete i.nav,M(i)}else M(t);return _}function R(e){var n=o.unwrap(t.title);document.title=n?e+" | "+n:e}var j,P,U=[],O=o.observable(!1),V=n.create(),_={handlers:[],routes:[],navigationModel:o.observableArray([]),activeItem:V,isNavigating:o.computed(function(){var e=V(),t=O(),n=e&&e.router&&e.router!=_&&e.router.isNavigating()?!0:!1;return t||n}),activeInstruction:o.observable(null),__router__:!0};r.includeIn(_),V.settings.areSameItem=function(e,t,n,r){return e==t?u(n,r):!1},V.settings.findChildActivator=function(e){return e&&e.router&&e.router.parent==_?e.router.activeItem:null},_.parseQueryString=function(t){var n,r;if(!t)return null;if(r=t.split("&"),0==r.length)return null;n={};for(var a=0;a<r.length;a++){var i=r[a];if(""!==i){var o=i.split(/=(.+)?/),s=o[0],l=o[1]&&decodeURIComponent(o[1].replace(/\+/g," ")),c=n[s];c?e.isArray(c)?c.push(l):n[s]=[c,l]:n[s]=l}}return n},_.route=function(e,t){_.handlers.push({routePattern:e,callback:t})},_.loadUrl=function(t){var n=_.handlers,r=null,a=t,o=t.indexOf("?");if(-1!=o&&(a=t.substring(0,o),r=t.substr(o+1)),_.relativeToParentRouter){var s=this.parent.activeInstruction();a=-1==o?s.params.join("/"):s.params.slice(0,-1).join("/"),a&&"/"==a.charAt(0)&&(a=a.substr(1)),a||(a=""),a=a.replace("//","/").replace("//","/")}a=a.replace(b,"");for(var l=0;l<n.length;l++){var c=n[l];if(c.routePattern.test(a))return c.callback(a,r),!0}return e.log("Route Not Found",t,P),_.trigger("router:route:not-found",t,_),_.parent&&(I=k),i.navigate(I,{trigger:!1,replace:!0}),f.explicitNavigation=!1,f.navigatingBack=!1,!1};var B;return o.isObservable(t.title)&&t.title.subscribe(function(){var e=_.activeInstruction(),t=null!=e?o.unwrap(e.config.title):"";R(t)}),_.updateDocumentTitle=function(e,n){var r=o.unwrap(t.title),a=n.config.title;B&&B.dispose(),a?o.isObservable(a)?(B=a.subscribe(R),R(a())):R(a):r&&(document.title=r)},_.navigate=function(t,n){return t&&-1!=t.indexOf("://")?(window.location.href=t,!0):((void 0===n||e.isBoolean(n)&&n||e.isObject(n)&&n.trigger)&&(f.explicitNavigation=!0),(e.isBoolean(n)&&!n||n&&void 0!=n.trigger&&!n.trigger)&&(I=t),i.navigate(t,n))},_.navigateBack=function(){i.navigateBack()},_.attached=function(){_.trigger("router:navigation:attached",j,P,_)},_.compositionComplete=function(){O(!1),_.trigger("router:navigation:composition-complete",j,P,_),E()},_.convertRouteToHash=function(e){if(e=e.replace(/\*.*$/,""),_.relativeToParentRouter){var t=_.parent.activeInstruction(),n=e?t.config.hash+"/"+e:t.config.hash;return i._hasPushState&&(n="/"+n),n=n.replace("//","/").replace("//","/")}return i._hasPushState?e:"#"+e},_.convertRouteToModuleId=function(e){return c(e)},_.convertRouteToTitle=function(e){var t=c(e);return t.substring(0,1).toUpperCase()+t.substring(1)},_.map=function(t,n){if(e.isArray(t)){for(var r=0;r<t.length;r++)_.map(t[r]);return _}return e.isString(t)||e.isRegExp(t)?(n?e.isString(n)&&(n={moduleId:n}):n={},n.route=t):n=t,N(n)},_.buildNavigationModel=function(t){for(var n=[],r=_.routes,a=t||100,i=0;i<r.length;i++){var o=r[i];o.nav&&(e.isNumber(o.nav)||(o.nav=++a),n.push(o))}return n.sort(function(e,t){return e.nav-t.nav}),_.navigationModel(n),_},_.mapUnknownRoutes=function(t,n){var r="*catchall",a=l(r);return _.route(a,function(o,s){var l=D(a,o,s),c={fragment:o,queryString:s,config:{route:r,routePattern:a},params:l.params,queryParams:l.queryParams};if(t)if(e.isString(t))c.config.moduleId=t,n&&i.navigate(n,{trigger:!1,replace:!0});else if(e.isFunction(t)){var d=t(c);if(d&&d.then)return d.then(function(){_.trigger("router:route:before-config",c.config,_),_.trigger("router:route:after-config",c.config,_),C(c)}),void 0}else c.config=t,c.config.route=r,c.config.routePattern=a;else c.config.moduleId=o;_.trigger("router:route:before-config",c.config,_),_.trigger("router:route:after-config",c.config,_),C(c)}),_},_.reset=function(){return P=j=void 0,_.handlers=[],_.routes=[],_.off(),delete _.options,_},_.makeRelative=function(t){return e.isString(t)&&(t={moduleId:t,route:t}),t.moduleId&&!d(t.moduleId,"/")&&(t.moduleId+="/"),t.route&&!d(t.route,"/")&&(t.route+="/"),t.fromParent&&(_.relativeToParentRouter=!0),_.on("router:route:before-config").then(function(e){t.moduleId&&(e.moduleId=t.moduleId+e.moduleId),t.route&&(e.route=""===e.route?t.route.substring(0,t.route.length-1):t.route+e.route)}),t.dynamicHash&&(_.on("router:route:after-config").then(function(e){e.routePattern=l(e.route?t.dynamicHash+"/"+e.route:t.dynamicHash),e.dynamicHash=e.dynamicHash||o.observable(e.hash)}),_.on("router:route:before-child-routes").then(function(e,t){for(var n=e.router,r=0;r<n.routes.length;r++){var a=n.routes[r],i=t.params.slice(0);a.hash=n.convertRouteToHash(a.route).replace(g,function(e){return i.length>0?i.shift():e}),a.dynamicHash(a.hash)}})),_},_.createChildRouter=function(){var e=x();return e.parent=_,e},_};return f=x(),f.explicitNavigation=!1,f.navigatingBack=!1,f.makeRoutesCaseSensitive=function(){w=!0},f.targetIsThisWindow=function(e){var t=s(e.target).attr("target");return!t||t===window.name||"_self"===t||"top"===t&&window===window.top?!0:!1},f.activate=function(t){return e.defer(function(n){if(m=n,f.options=e.extend({routeHandler:f.loadUrl},f.options,t),i.activate(f.options),i._hasPushState)for(var r=f.routes,a=r.length;a--;){var o=r[a];o.hash=o.hash.replace("#","/")}var l=f.options.root&&new RegExp("^"+f.options.root+"/");s(document).delegate("a","click",function(e){if(i._hasPushState){if(!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&f.targetIsThisWindow(e)){var t=s(this).attr("href");null==t||"#"===t.charAt(0)||/^[a-z]+:/i.test(t)||(f.explicitNavigation=!0,e.preventDefault(),l&&(t=t.replace(l,"")),i.navigate(t))}}else f.explicitNavigation=!0}),i.options.silent&&m&&(m.resolve(),m=null)}).promise()},f.deactivate=function(){i.deactivate()},f.install=function(){o.bindingHandlers.router={init:function(){return{controlsDescendantBindings:!0}},update:function(e,t,n,r,i){var s=o.utils.unwrapObservable(t())||{};if(s.__router__)s={model:s.activeItem(),attached:s.attached,compositionComplete:s.compositionComplete,activate:!1};else{var l=o.utils.unwrapObservable(s.router||r.router)||f;s.model=l.activeItem(),s.attached=l.attached,s.compositionComplete=l.compositionComplete,s.activate=!1}a.compose(e,s,i)}},o.virtualElements.allowedBindings.router=!0},f});
define('viewmodels/departments/create',["global/session","services/errorhandler","services/logger","services/config","durandal/system","plugins/router"],function(e,t,n,r,a){function i(){return ga("send","pageview",{page:window.location.href,title:document.title}),!0}function o(){return $("html,body").animate({scrollTop:0},0),m.units.all().then(function(e){p.units(e),Q.fcall(d).then(function(){p.errors=ko.validation.group([p.department().name,p.department().id,p.department().unitId,p.department().sequenceValue])})})}function s(){return m.hasChanges()?confirm("You have unsaved changes. Do you want to discard them?"):!0}function l(){m.hasChanges()&&m.rollback(),p.department(void 0)}function d(){console.log("Initializing department.");var e=m.departments.create({});return p.department(e),p.department().unitId(p.units()[0].id())}function c(){var e=this;return 0!==p.errors().length?(p.errors.showAllMessages(),n.logError("Errors detected.",null,a.getModuleId(p),!0),void 0):m.hasChanges()?(m.commit().then(function(e){n.logSuccess("Save successful",e,a.getModuleId(p),!0)}).fail(e.handleError),void 0):n.log("No changes were detected.",null,a.getModuleId(p),!0)}function u(){var e=m.rollback();return n.log("Changes were discarded.",e,a.getModuleId(p),!0)}var m=e.unitofwork(),p={activate:i,attached:o,canDeactivate:s,deactivate:l,department:ko.observable(),units:ko.observableArray(),cancelDepartment:u,saveDepartment:c};return t.includeIn(p),p});
define('viewmodels/departments/index',["global/session","services/errorhandler","services/config","services/logger","durandal/system"],function(e,t,n,r,a){function i(){return ga("send","pageview",{page:window.location.href,title:document.title}),!0}function o(){return c.hasChanges()?(r.log("Attempting save.",null,a.getModuleId(f),!0),c.commit().then(function(e){return r.logSuccess("Save successful",e,a.getModuleId(f),!0)}).fail(function(e){c.rollback(),f.handleError(e)})):r.log("No changes were detected.",null,a.getModuleId(f),!0)}function s(){if(!c.hasChanges())return r.log("No changes were detected.",null,a.getModuleId(f),!0);var e=c.rollback();return r.log("Changes were discarded.",e,a.getModuleId(f),!0)}function l(e){if(void 0!==e&&"Select a department..."!==e){var t=breeze.Predicate.create("departmentId","==",e);return console.log("Getting employee count for departmentId: "+e),f.employeeCount("Loading..."),c.employments.count(t).then(function(t){console.log("getEmployeeCount response: "+t),f.employeeCount(parseInt(t,10));var n=new breeze.Predicate("id","==",e);return c.departments.find(n).then(function(e){console.log("Department query response: "+e[0].name()),f.selectedDepartment(e[0])})})}}function d(){if(f.employeeCount>0)return r.logError("Cannot delete departments with employees.",null,a.getModuleId(f),!0);var e=new breeze.Predicate("departmentId","==",f.selectedDepartment().id());return c.roles.find(e).then(function(e){return $.each(e,function(e,t){c.roles.delete(t)})}).then(function(){return c.departments.delete(f.selectedDepartment()),r.log("Department marked for deletion. Click save to continue.",null,a.getModuleId(f),!0)})}var c=e.unitofwork(),u=ko.observableArray(),m=ko.observable(),p=function(){var e=this;return 0==u()&&c.units.all().then(function(t){e.units(t),m(t[0].departments()[0].id())}),!0},f={activate:i,attached:p,employeeCount:ko.observable(),selectedDepartment:ko.observable(),selectedDepartmentId:m,units:u,cancelChanges:s,deleteDepartment:d,saveChanges:o};return f.selectedDepartmentId.subscribeChanged(function(e){return console.log("selectedDepartmentId change: "+e),"Select a department..."!==e&&void 0!==e&&""!==e?l(e):void 0}),t.includeIn(f),f});
define('viewmodels/employments/edit',["global/session","services/logger","plugins/router","durandal/system","services/errorhandler"],function(e,t,n,r,a){function i(e){return ga("send","pageview",{page:window.location.href,title:document.title}),p.personId(e),!0}function o(){return $("html,body").animate({scrollTop:0},0),m.units.all().then(function(e){p.units(e);var t=e,n=new breeze.Predicate("personId","==",p.personId());m.employments.find(n).then(function(e){p.employments(e);var n=c(e),r=$.map(t,function(e){for(var t,r=[],a=parseInt(p.columnLength(),10),i=0,o=e.departments().length;o>i;i++)0===i%a&&(t&&r.push(t),t=[]),t.push(function(){var t={department:e.departments()[i],isSelected:ko.observable(!!n[e.departments()[i].id()])};return t}());return t&&r.push(t),{unit:e,departmentRows:r}});p.employmentVMs(r)})}),!0}function s(){p.employments([]),p.personId(void 0),p.employmentVMs([]),p.units([])}function l(){return u(),m.hasChanges()?(console.log("Attempting save."),m.commit().then(function(e){return t.logSuccess("Save successful",e,r.getModuleId(p),!0)}).fail(function(e){m.rollback(),p.handleError(e)})):t.log("No changes were detected.",null,r.getModuleId(p),!0)}function d(){return m.rollback(),n.navigateBack()}function c(e){var t={};return $.each(e,function(e,n){t[n.departmentId()]=n}),t}function u(){var e=p.employments(),t=p.employmentVMs(),n=c(e);$.each(t,function(e,t){var r=t.departmentRows;$.each(r,function(e,t){$.each(t,function(e,t){var r=n[t.department.id()];t.isSelected()?r||(r=m.employments.create({personId:p.personId(),departmentId:t.department.id()})):r&&r.entityAspect.setDeleted()})})})}var m=e.unitofwork(),p={activate:i,attached:o,deactivate:s,columnLength:ko.observable(3),employments:ko.observableArray(),employmentVMs:ko.observableArray(),personId:ko.observable(),units:ko.observableArray(),cancelChanges:d,saveChanges:l};return a.includeIn(p),p});
define('viewmodels/not-found',["plugins/router"],function(e){return{convertRouteToHash:e.convertRouteToHash,activate:function(){ga("send","pageview",{page:window.location.href,title:document.title})}}});
define('viewmodels/persons/create',["global/session","services/errorhandler","services/logger","services/config","durandal/system","plugins/router"],function(e,t,n,r,a,i){function o(){return ga("send","pageview",{page:window.location.href,title:document.title}),!0}function s(){return $("html,body").animate({scrollTop:0},0),f.appointmentTypes.all().then(function(e){v.appointmentTypes(e)}),f.facultyTypes.all().then(function(e){v.facultyTypes(e)}),f.leaveTypes.all().then(function(e){v.leaveTypes(e)}),f.rankTypes.all().then(function(e){v.rankTypes(e)}),f.statusTypes.all().then(function(e){v.statusTypes(e)}),f.units.all().then(function(e){v.units(e),Q.fcall(c).then(function(){v.errors=ko.validation.group([v.person().pid,v.person().firstName,v.person().lastName,v.person().homeDepartmentId])})}),!0}function l(){return f.hasChanges()?confirm("You have unsaved changes. Do you want to discard them?"):!0}function d(){f.hasChanges()&&f.rollback(),v.person(void 0)}function c(){var e=f.persons.create();return e.salaries.push(f.salaries.create({personId:e.id(),cycleYear:r.currentCycleYear,meritAdjustmentTypeId:r.meritAdjustmentTypeIdIndicatesNotReviewed})),v.person(e)}function u(){var e=this;return 0!==v.errors().length?(v.errors.showAllMessages(),n.logError("Errors detected.",null,a.getModuleId(v),!0),void 0):f.hasChanges()?(f.commit().then(function(e){n.logSuccess("Save successful",e,a.getModuleId(v),!0),n.log("Transitioning to the view for assigning employing departments to the new employee",e,a.getModuleId(v),!0),setTimeout(p,1800)}).fail(e.handleError),!0):n.log("No changes were detected.",null,a.getModuleId(v),!0)}function m(){f.rollback()}function p(){i.navigate("/employments/edit/"+v.person().id())}var f=e.unitofwork(),v={activate:o,attached:s,canDeactivate:l,deactivate:d,appointmentTypes:ko.observableArray(),facultyTypes:ko.observableArray(),leaveTypes:ko.observableArray(),person:ko.observable(),rankTypes:ko.observableArray(),salary:ko.observable(),statusTypes:ko.observableArray(),units:ko.observableArray(),cancelPerson:m,savePerson:u};return t.includeIn(v),v});
define('viewmodels/persons/edit-home-department',["global/session","services/logger","plugins/router","durandal/system","services/errorhandler"],function(e,t,n,r,a){function i(e){return ga("send","pageview",{page:window.location.href,title:document.title}),u.personId(e),!0}function o(){return $("html,body").animate({scrollTop:0},0),c.units.all().then(function(e){u.units(e),c.persons.withId(u.personId()).then(function(e){u.person(e.entity)})}),!0}function s(){u.personId(void 0),u.person(void 0),u.units([])}function l(){return c.hasChanges()?(console.log("Attempting save."),c.commit().then(function(e){return t.logSuccess("Save successful",e,r.getModuleId(u),!0)}).fail(function(e){c.rollback(),u.handleError(e)})):t.log("No changes were detected.",null,r.getModuleId(u),!0)}function d(){return c.rollback(),n.navigateBack()}var c=e.unitofwork(),u={activate:i,attached:o,deactivate:s,person:ko.observable({homeDepartmentId:ko.observable("Loading...")}),personId:ko.observable(),units:ko.observableArray(),cancelChanges:d,saveChanges:l};return a.includeIn(u),u});
define('viewmodels/reports/base-salary-adjustment',["global/session","services/errorhandler","services/config"],function(e,t,n){function r(e,t){var n=this;if(ga("send","pageview",{page:window.location.href,title:document.title}),t){var r=o.departments.withId(t).then(function(e){i([e.entity])});Q.all([r]).fail(n.handleError)}else{var a=breeze.Predicate.create("toLower(unitId)","==",e),s=o.departments.find(a).then(function(e){i(e)});Q.all([s]).fail(n.handleError)}return!0}function a(){return s.departmentData([]),!0}function i(e){var t=this;return $.each(e,function(e,r){var a=breeze.Predicate.create("person.employments","any","departmentId","==",r.id()),i=breeze.Predicate.create("cycleYear","==",n.currentCycleYear),l=breeze.Predicate.and([a,i]),d="person",c=o.baseSalaryAdjustments.find(l,d).then(function(e){return s.departmentData.push({department:r,adjustments:e})});Q.all([c]).fail(t.handleError)})}var o=e.unitofwork(),s={activate:r,deactivate:a,departmentData:ko.observableArray()};return t.includeIn(s),s});
define('viewmodels/reports/fo-export',["global/session","services/errorhandler","services/config"],function(e,t,n){function r(e,t){var n=this;if(l.unitId(e),l.departmentId(t),ga("send","pageview",{page:window.location.href,title:document.title}),t){var r=s.departments.withId(t).then(function(e){o([e.entity])});Q.all([r]).fail(n.handleError)}else{var a=breeze.Predicate.create("toLower(unitId)","==",e),i=s.departments.find(a).then(function(e){o(e)});Q.all([i]).fail(n.handleError)}return!0}function a(){return l.departmentData([]),!0}function i(){l.departmentId()?window.location.assign("/ReportFile/DepartmentFiscalOfficerExport/"+l.departmentId()):l.unitId()&&window.location.assign("/ReportFile/UnitFiscalOfficerExport/"+l.unitId())}function o(e){var t=this;return $.each(e,function(e,r){var a=breeze.Predicate.create("person.employments","any","departmentId","==",r.id()),i=breeze.Predicate.create("cycleYear","==",n.currentCycleYear),o=breeze.Predicate.and([a,i]),d="person, person.statusType",c=s.salaries.find(o,d).then(function(e){return l.departmentData.push({department:r,salaries:e})});Q.all([c]).fail(t.handleError)})}var s=e.unitofwork(),l={activate:r,deactivate:a,departmentData:ko.observableArray(),departmentId:ko.observable(),unitId:ko.observable(),downloadExcel:i};return t.includeIn(l),l});
define('viewmodels/reports/index',["global/session","services/errorhandler","services/config","plugins/router","services/logger"],function(e,t,n,r,a){function i(){return ga("send","pageview",{page:window.location.href,title:document.title}),!0}function o(){var t=this,n=["Department","Unit"],r=[{route:"fo-export",text:"Fiscal officer export"},{route:"meeting",text:"Meeting"},{route:"base-salary-adjustment",text:"Faculty with base salary adjustments"},{route:"multiple-employments",text:"Faculty with multiple departments"},{route:"merit-summary-report",text:"Merit summary"},{route:"salaries-by-faculty-type",text:"Salaries by faculty type"},{route:"unreviewed",text:"Unreviewed faculty"}],a=l.units.all().then(function(e){d.units(e),d.selectedDepartmentId(e[0].departments()[0].id())});return e.userIsInRole("manage-all")&&r.push({route:"role-assignment",text:"User roles"}),Q.all([a]).fail(t.handleError),d.audienceTypes(n),d.reportTypes(r),!0}function s(){var e;switch(d.selectedAudienceType()){case"Department":d.selectedDepartmentId()&&"Choose..."!==d.selectedDepartmentId()?(e="reports/"+d.selectedReportType()+"/"+d.selectedDepartmentId(),r.navigate(e)):a.logError("Choose a department to continue.",null,null,!0);break;case"Unit":d.selectedUnitId()?(e="reports/"+d.selectedReportType()+"/"+d.selectedUnitId(),r.navigate(e)):a.logError("Choose a unit to continue.",null,null,!0)}}var l=e.unitofwork(),d={activate:i,attached:o,audienceTypes:ko.observableArray(),reportTypes:ko.observableArray(),selectedAudienceType:ko.observable(),selectedDepartmentId:ko.observable(),selectedReportType:ko.observable(),selectedUnitId:ko.observable(),units:ko.observableArray(),generateReport:s};return t.includeIn(d),d});
define('viewmodels/reports/meeting',["global/session","services/errorhandler","services/config"],function(e,t,n){function r(e){d.meritAdjustmentTypeComment(e.meritAdjustmentType().name()),d.meritAdjustmentNoteComment(e.meritAdjustmentNote()),d.specialAdjustmentTypesComment(e.specialSalaryAdjustments()),d.specialAdjustmentNoteComment(e.specialAdjustmentNote()),$(document).foundation(),$("#Comments").foundation("reveal","open")}function a(e,t){var n=this;if(d.unitId(e),d.departmentId(t),ga("send","pageview",{page:window.location.href,title:document.title}),t){var r=l.departments.withId(t).then(function(e){s([e.entity])});Q.all([r]).fail(n.handleError)}else{var a=breeze.Predicate.create("toLower(unitId)","==",e),i=l.departments.find(a).then(function(e){s(e)});Q.all([i]).fail(n.handleError)}return!0}function i(){return d.departmentData([]),!0}function o(){d.departmentId()?d.isExecutiveExcel()?window.location.assign("/ReportFile/ExecutiveDepartmentMeeting/"+d.departmentId()):window.location.assign("/ReportFile/DepartmentMeeting/"+d.departmentId()):d.unitId()&&(d.isExecutiveExcel()?window.location.assign("/ReportFile/ExecutiveUnitMeeting/"+d.unitId()):window.location.assign("/ReportFile/UnitMeeting/"+d.unitId()))}function s(e){var t=this;return $.each(e,function(e,r){var a=breeze.Predicate.create("person.employments","any","departmentId","==",r.id()),i=breeze.Predicate.create("cycleYear","==",n.currentCycleYear),o=breeze.Predicate.and([a,i]),s="person, specialSalaryAdjustments",c=l.salaries.find(o,s).then(function(e){return d.departmentData.push({department:r,salaries:e})});Q.all([c]).fail(t.handleError)})}var l=e.unitofwork(),d={activate:a,deactivate:i,departmentData:ko.observableArray(),departmentId:ko.observable(),isExecutiveExcel:ko.observable(!1),unitId:ko.observable(),showComments:r,meritAdjustmentTypeComment:ko.observable(),meritAdjustmentNoteComment:ko.observable(),specialAdjustmentTypesComment:ko.observableArray(),specialAdjustmentNoteComment:ko.observable(),downloadExcel:o};return t.includeIn(d),d});
define('viewmodels/reports/merit-summary-report',["global/session","services/errorhandler","services/config"],function(e,t,n){function r(e,t){var n=this;if(d.unitId(e),d.departmentId(t),ga("send","pageview",{page:window.location.href,title:document.title}),t){var r=l.departments.withId(t).then(function(e){o([e.entity])});Q.all([r]).fail(n.handleError)}else{var a=breeze.Predicate.create("toLower(unitId)","==",e),i=l.departments.find(a).then(function(e){o(e)});Q.all([i]).fail(n.handleError)}return!0}function a(){return d.departmentData([]),d.summaryMerit([]),!0}function i(){d.departmentId()?window.location.assign("/ReportFile/DepartmentMeritSummary/"+d.departmentId()):d.unitId()&&window.location.assign("/ReportFile/UnitMeritSummary/"+d.unitId())}function o(e){var t=this;return $.each(e,function(e,r){var a=breeze.Predicate.create("person.employments","any","departmentId","==",r.id()),i=breeze.Predicate.create("cycleYear","==",n.currentCycleYear),o=breeze.Predicate.and([a,i]),s="person",c=l.salaries.find(o,s).then(function(e){return d.departmentData.push({department:r,salaries:e})});Q.all([c]).fail(t.handleError)})}function s(e){var t=Math.floor(e.length/2);return e.length%2?e[t].meritIncrease():(e[t-1].meritIncrease()+e[t].meritIncrease())/2}var l=e.unitofwork(),d={activate:r,deactivate:a,departmentData:ko.observableArray(),departmentId:ko.observable(),unitId:ko.observable(),downloadExcel:i,summaryMerit:ko.observableArray()};return t.includeIn(d),d.departmentData.subscribe(function(e){ko.utils.arrayForEach(e,function(t){var n=e.indexOf(t);if(n==e.length-1){salariesSorted=t.salaries.sort(function(e,t){return e.meritIncrease()===t.meritIncrease()?0:e.meritIncrease()>t.meritIncrease()?-1:1});var r=0;ko.utils.arrayForEach(salariesSorted,function(e){r+=e.meritIncrease()});var a=r/salariesSorted.length,i=s(salariesSorted);d.summaryMerit.push({department:t.department.name(),highestMerit:salariesSorted[0],lowestMerit:salariesSorted[salariesSorted.length-1],meanMerit:ko.observable(a).extend({currency:[0]}),medianMerit:ko.observable(i).extend({currency:[0]})})}})}),d});
define('viewmodels/reports/multiple-employments',["global/session","services/errorhandler"],function(e,t){function n(e,t){var n=this;if(ga("send","pageview",{page:window.location.href,title:document.title}),t){var r=i.departments.withId(t).then(function(e){a([e.entity])});Q.all([r]).fail(n.handleError)}else{var o=breeze.Predicate.create("toLower(unitId)","==",e),s=i.departments.find(o).then(function(e){a(e)});Q.all([s]).fail(n.handleError)}return!0}function r(){return o.departmentData([]),!0}function a(e){var t=this;return $.each(e,function(e,n){var r=i.personsWithMultipleEmployments(n.id()).then(function(e){return o.departmentData.push({department:n,data:e})});Q.all([r]).fail(t.handleError)})}var i=e.unitofwork(),o={activate:n,deactivate:r,departmentData:ko.observableArray()};return t.includeIn(o),o});
define('viewmodels/reports/role-assignment',["global/session","services/errorhandler","services/config"],function(e,t){function n(e,t){var n=this;if(o.unitId(e),o.departmentId(t),ga("send","pageview",{page:window.location.href,title:document.title}),t){var r=i.departments.withId(t).then(function(e){a([e.entity])});Q.all([r]).fail(n.handleError)}else{var s=breeze.Predicate.create("toLower(unitId)","==",e),l=i.departments.find(s).then(function(e){a(e)});Q.all([l]).fail(n.handleError)}return!0}function r(){return o.departmentData([]),!0}function a(e){var t=this;return $.each(e,function(e,n){var r=breeze.Predicate.create("departmentId","==",n.id()),a="roleAssignments, roleAssignments.User",s=i.roles.find(r,a).then(function(e){return o.departmentData.push({department:n,roles:e})});Q.all([s]).fail(t.handleError)})}var i=e.unitofwork(),o={activate:n,deactivate:r,departmentData:ko.observableArray(),departmentId:ko.observable(),unitId:ko.observable()};return t.includeIn(o),o});
define('viewmodels/reports/salaries-by-faculty-type',["global/session","services/errorhandler"],function(e,t){function n(e,t){var n=this;if(s.unitId(e),s.departmentId(t),ga("send","pageview",{page:window.location.href,title:document.title}),t){var r=o.departments.withId(t).then(function(e){a([e.entity])});Q.all([r]).fail(n.handleError)}else{var i=breeze.Predicate.create("toLower(unitId)","==",e),l=o.departments.find(i).then(function(e){a(e)});Q.all([l]).fail(n.handleError)}return!0}function r(){return s.departmentData([]),!0}function a(e){var t=this;return $.each(e,function(e,n){var r=o.salariesByFacultyType(n.id()).then(function(e){return $.each(e,function(t){e[t].formattedStartingSalaries=ko.observable(e[t].startingSalaries).extend({currency:[0]}),e[t].formattedMeritIncreases=ko.observable(e[t].meritIncreases).extend({currency:[0]}),e[t].formattedSpecialIncreases=ko.observable(e[t].specialIncreases).extend({currency:[0]}),e[t].formattedEminentIncreases=ko.observable(e[t].eminentIncreases).extend({currency:[0]}),e[t].formattedNewSalaries=ko.observable(e[t].newSalaries).extend({currency:[0]})}),s.departmentData.push({department:n,data:e})});Q.all([r]).fail(t.handleError)})}function i(){s.departmentId()?window.location.assign("/ReportFile/DepartmentSalariesByFacultyType/"+s.departmentId()):s.unitId()&&window.location.assign("/ReportFile/UnitSalariesByFacultyType/"+s.unitId())}var o=e.unitofwork(),s={activate:n,deactivate:r,departmentData:ko.observableArray(),departmentId:ko.observable(),unitId:ko.observable(),downloadExcel:i};return t.includeIn(s),s});
define('viewmodels/reports/unreviewed',["global/session","services/errorhandler","services/config"],function(e,t,n){function r(e,t){var n=this;if(ga("send","pageview",{page:window.location.href,title:document.title}),t){var r=o.departments.withId(t).then(function(e){i([e.entity])});Q.all([r]).fail(n.handleError)}else{var a=breeze.Predicate.create("toLower(unitId)","==",e),s=o.departments.find(a).then(function(e){i(e)});Q.all([s]).fail(n.handleError)}return!0}function a(){return s.departmentData([]),!0}function i(e){var t=this;return $.each(e,function(e,r){var a=breeze.Predicate.create("person.employments","any","departmentId","==",r.id()),i=breeze.Predicate.create("cycleYear","==",n.currentCycleYear),l=breeze.Predicate.create("meritAdjustmentTypeId","==",1),d=breeze.Predicate.create("person.statusTypeId","==",n.activeStatusTypeId),c=breeze.Predicate.and([a,i,l,d]),u="person",m=o.salaries.find(c,u).then(function(e){return s.departmentData.push({department:r,salaries:e})});Q.all([m]).fail(t.handleError)})}var o=e.unitofwork(),s={activate:r,deactivate:a,departmentData:ko.observableArray()};return t.includeIn(s),s});
define('viewmodels/salaries/edit',["global/session","services/errorhandler","services/logger","plugins/router","durandal/system"],function(e,t,n,r,a){function i(e){return ga("send","pageview",{page:window.location.href,title:document.title}),I.salaryId(e),!0}function o(){var e=this;$("html,body").animate({scrollTop:0},0);var t=m.appointmentTypes.all().then(function(t){e.appointmentTypes(t)}),n=m.facultyTypes.all().then(function(t){e.facultyTypes(t)}),r=m.leaveTypes.all().then(function(t){e.leaveTypes(t)}),a=m.meritAdjustmentTypes.all().then(function(t){e.meritAdjustmentTypes(t)}),i=m.rankTypes.all().then(function(t){e.rankTypes(t)}),o=m.specialAdjustmentTypes.all().then(function(t){e.adjustmentTypes(t)}),s=m.statusTypes.all().then(function(t){e.statusTypes(t)});m.units.all().then(function(e){I.units(e)});var l=new breeze.Predicate("id","==",I.salaryId()),d="person, specialSalaryAdjustments, leaveType",u=m.salaries.find(l,d).then(function(t){if(t.length>0){var n=t[0],r=c(n),a=$.map(e.adjustmentTypes(),function(e){return{adjustment:e,isSelected:ko.observable(!!r[e.id()])}});I.adjustmentVMs(a),I.salary(n);var i=new breeze.Predicate("personId","==",I.salary().person().id()),o="department";m.employments.find(i,o).then(function(e){I.employments(e)}),I.errors=ko.validation.group([I.salary().meritAdjustmentTypeId,I.salary().meritAdjustmentNote,I.salary().specialAdjustmentNote,I.salary().specialSalaryAdjustments])}});return Q.all([t,n,r,a,i,u,o,s]).fail(e.handleError),!0}function s(){return I.salary(void 0),I.employments(void 0),I.employmentVMs(void 0),!0}function l(){return u(),0!==I.errors().length?(I.errors.showAllMessages(),n.logError("Errors detected.",null,a.getModuleId(I),!0),void 0):m.hasChanges()?m.commit().then(function(e){return n.logSuccess("Save successful",e,a.getModuleId(I),!0),r.navigateBack()}):n.log("No changes were detected.",null,a.getModuleId(I),!0)}function d(){return m.rollback(),r.navigateBack()}function c(e){var t={};return $.each(e.specialSalaryAdjustments(),function(e,n){t[n.specialAdjustmentTypeId()]=n}),t}function u(){var e=I.salary(),t=I.adjustmentVMs(),n=c(e);$.each(t,function(t,r){var a=n[r.adjustment.id()];r.isSelected()?a||(a=m.specialSalaryAdjustments.create({salaryId:e.id(),specialAdjustmentTypeId:r.adjustment.id()})):a&&a.entityAspect.setDeleted()})}var m=e.unitofwork(),p=ko.observableArray(),f=ko.observableArray(),v=ko.observableArray(),h=ko.observableArray(),g=ko.observableArray(),y=ko.observableArray(),b=ko.observableArray(),w=ko.observableArray(),I={activate:i,attached:o,deactivate:s,adjustmentVMs:ko.observableArray(),appointmentTypes:p,employments:ko.observableArray(),employmentVMs:ko.observableArray(),facultyTypes:f,leaveTypes:v,meritAdjustmentTypes:h,rankTypes:g,salary:ko.observable(),salaryId:ko.observable(),adjustmentTypes:y,statusTypes:b,units:w,cancelChanges:d,saveChanges:l};return t.includeIn(I),I});
define('viewmodels/salaries/index',["global/session","services/errorhandler","services/config"],function(e,t,n){function r(){return ga("send","pageview",{page:window.location.href,title:document.title}),i.statusTypes.all().then(function(e){d.statusTypes(e)}),!0}function a(e,t){if(void 0!==e&&"Select a department..."!==e&&void 0!==t){var r=breeze.Predicate.create("person.employments","any","departmentId","==",e).and("cycleYear","==",n.currentCycleYear).and("person.statusTypeId","==",t),a="person";return i.salaries.find(r,a).then(function(e){d.salaries(e)})}}var i=e.unitofwork(),o=ko.observableArray(),s=ko.observable(),l=function(){var e=this;return 0==o()&&i.units.all().then(function(t){e.units(t),s(t[0].departments()[0].id())}),!0},d={activate:r,attached:l,salaries:ko.observableArray(),selectedDepartmentId:s,selectedStatusTypeId:ko.observable(n.activeStatusTypeId),statusTypes:ko.observableArray(),units:o};return d.selectedDepartmentId.subscribe(function(e){return"Select a department..."===e||void 0===e||""===e?d.salaries([]):(a(e,d.selectedStatusTypeId()),void 0)}),d.selectedStatusTypeId.subscribe(function(e){a(d.selectedDepartmentId(),e)}),t.includeIn(d),d});
define('viewmodels/salaries/search',["global/session","services/errorhandler"],function(e,t){function n(){return ga("send","pageview",{page:window.location.href,title:document.title}),!0}var r=e.unitofwork(),a={activate:n,instantaneousSearchString:ko.observable(""),isSearching:ko.observable(!1),searchResults:ko.observableArray()};return t.includeIn(a),a.throttledSearchString=ko.computed(a.instantaneousSearchString).extend({throttle:750}),a.throttledSearchString.subscribe(function(e){if(!e.isNullOrWhiteSpace()){var t=e.trim().toLowerCase(),n=breeze.Predicate.create("personId","==",t),i=breeze.Predicate.create("toLower(person.pid)","==",t),o=breeze.Predicate.create("toLower(person.firstName)",breeze.FilterQueryOp.Contains,t),s=breeze.Predicate.create("toLower(person.lastName)",breeze.FilterQueryOp.Contains,t),l=breeze.Predicate.or([n,i,o,s]),d="person";return a.isSearching(!0),r.salaries.find(l,d).then(function(e){return a.isSearching(!1),a.searchResults(e)})}}),a});
define('viewmodels/settings/index',["services/errorhandler","services/logger"],function(e){function t(){return ga("send","pageview",{page:window.location.href,title:document.title}),!0}var n={activate:t};return e.includeIn(n),n});
define('viewmodels/shell',["plugins/router","services/security","services/errorhandler","services/entitymanagerprovider","model/modelBuilder","services/logger","global/session","services/config"],function(e,t,n,r,a,i,o,s){function l(){var e=this;return r.prepare().then(m).fail(e.handlevalidationerrors)}function d(e){$(e).foundation();var t=new chrisjsherm.Counter({seconds:s.logOutCounterSeconds,onUpdateStatus:function(e){parseInt(e,10)<91&&($("#timeoutModal").foundation("reveal","open"),$(".counter").text(e))},onCounterEnd:function(){window.location.assign(s.logOutUrl)}});t.start(),$(document).ajaxSuccess(function(){t.restart(),$("#timeoutModal").foundation("reveal","close")}),$(".close-reveal-modal").on("click",function(){$.get(s.extendSessionUrl)}),$("span.button-close-reveal-modal").on("click",function(){$("a.close-reveal-modal").trigger("click")})}function c(){window.location.assign(s.logOutUrl)}function u(){return e.makeRelative({moduleId:"viewmodels"}),e.guardRoute=function(e,t){if("undefined"!=typeof t.config.requiredRoles){var n=o.userIsInRole(t.config.requiredRoles);return n||i.log("Access denied. Navigation canceled.",null,"viewmodels/shell",!0,"warning"),n}return!0},e.map([{route:["","salaries","salaries/index"],moduleId:"salaries/index",title:"Salaries",nav:!0,hash:"#salaries/index"},{route:"salaries/search",moduleId:"salaries/search",title:"Search",nav:!0,hash:"#salaries/search"},{route:["reports","reports/index"],moduleId:"reports/index",title:"Reports",nav:!0,hash:"#reports/index"},{route:["departments","departments/index"],moduleId:"departments/index",title:"Departments",nav:!1,hash:"#departments/index",requiredRoles:["manage-all"]},{route:"departments/create",moduleId:"departments/create",title:"New department",nav:!1,hash:"#departments/create",requiredRoles:["manage-all"]},{route:"employments/edit/:personId",moduleId:"employments/edit",title:"Edit employments",nav:!1,hash:"#employments/edit",requiredRoles:["manage-all"]},{route:"persons/create",moduleId:"persons/create",title:"New employee",nav:!1,hash:"#persons/create",requiredRoles:["manage-all"]},{route:"persons/edit-home-department/:personId",moduleId:"persons/edit-home-department",title:"Edit home department",nav:!1,hash:"#persons/edit-home-department",requiredRoles:["manage-all"]},{route:"reports/base-salary-adjustment/:unitid(/:departmentid)",moduleId:"reports/base-salary-adjustment",title:"Base salary adjustment report",nav:!1,hash:"#reports/base-salary-adjustment"},{route:"reports/fo-export/:unitid(/:departmentid)",moduleId:"reports/fo-export",title:"Fiscal officer export",nav:!1,hash:"#reports/fo-export"},{route:"reports/merit-summary-report/:unitid(/:departmentid)",moduleId:"reports/merit-summary-report",title:"Merit summary report",nav:!1,hash:"#reports/merit-summary-report"},{route:"reports/meeting/:unitid(/:departmentid)",moduleId:"reports/meeting",title:"Meeting report",nav:!1,hash:"#reports/meeting"},{route:"reports/multiple-employments/:unitid(/:departmentid)",moduleId:"reports/multiple-employments",title:"Multiple departments report",nav:!1,hash:"#reports/multiple-employments"},{route:"reports/role-assignment/:unitid(/:departmentid)",moduleId:"reports/role-assignment",title:"User roles report",nav:!1,hash:"#reports/role-assignment",requiredRoles:["manage-all"]},{route:"reports/salaries-by-faculty-type/:unitid(/:departmentid)",moduleId:"reports/salaries-by-faculty-type",title:"Salaries by faculty type report",nav:!1,hash:"#reports/salaries-by-faculty-type"},{route:"reports/unreviewed/:unitid(/:departmentid)",moduleId:"reports/unreviewed",title:"Unreviewed faculty report",nav:!1,hash:"#reports/unreviewed"},{route:"salaries/edit/:salaryid",moduleId:"salaries/edit",title:"Edit salary",nav:!1,hash:"#salaries/edit/:salaryid"},{route:["settings","settings/index"],moduleId:"settings/index",title:"Settings",nav:!1,hash:"#settings/index",requiredRoles:"manage-all"},{route:["users","users/index"],moduleId:"users/index",title:"Users",nav:!1,hash:"#users/index",requiredRoles:["manage-users","manage-all"]},{route:"users/edit/:userid",moduleId:"users/edit",title:"Edit user",nav:!1,hash:"#users/edit/:salaryid",requiredRoles:["manage-users","manage-all"]},{route:"users/create",moduleId:"users/create",title:"New user",nav:!1,hash:"#users/create",requiredRoles:["manage-users","manage-all"]},{route:"not-found",moduleId:"not-found",title:"Not found",nav:!1}]).buildNavigationModel().mapUnknownRoutes("not-found","not-found").activate({pushState:!0})}function m(){return t.getUserInfo().done(function(e){e.userName?(o.setUser(e),p.username(e.userName),o.initUnitOfWork(),u()):(i.log("Access denied. Navigation canceled.",null,"viewmodels/shell",!0,"warning"),u())}).fail(function(){i.log("Access denied. Navigation canceled.",null,"viewmodels/shell",!0,"warning"),u()})}r.modelBuilder=a.extendMetadata;var p={activate:l,attached:d,router:e,username:ko.observable(),logOut:c};return n.includeIn(p),p});
define('viewmodels/users/create',["global/session","services/errorhandler","services/logger","plugins/router","durandal/system"],function(e,t,n,r,a){function i(){if(ga("send","pageview",{page:window.location.href,title:document.title}),e.userIsInRole("manage-all"))m.units.all().then(function(e){p.units(e),p.selectedDepartmentId(e[0].departments()[0].id())});else{var t=m.manageableUnits.all().then(function(e){p.units(e),p.selectedDepartmentId(e[0].departments()[0].id())});Q.all([t]).fail(self.handleError)}return Q.all([t]).fail(self.handleError),p.user(m.users.create()),!0}function o(){return m.hasChanges()?confirm("You have unsaved changes. Do you want to discard them?"):!0}function s(){return m.hasChanges()&&m.rollback(),p.assignmentVMs([]),p.selectedDepartmentId(void 0),p.units([]),p.user(void 0),!0}function l(){var e=this;return u(),m.hasChanges()?(m.commit().then(function(e){return n.logSuccess("Save successful",e,a.getModuleId(p),!0),r.navigateBack()}).fail(e.handleError),!0):n.log("No changes were detected.",null,a.getModuleId(p),!0)}function d(){return m.rollback(),r.navigateBack()}function c(e){var t={};return $.each(e.roleAssignments(),function(e,n){t[n.roleId()]=n}),t}function u(){var e=p.user(),t=p.assignmentVMs(),n=c(e);$.each(t,function(t,r){var a=n[r.role.id()];r.isSelected()?a||(a=m.roleAssignments.create({roleId:r.role.id(),userId:e.id()})):a&&a.entityAspect.setDeleted()})}var m=e.unitofwork(),p={activate:i,canDeactivate:o,deactivate:s,assignmentVMs:ko.observableArray(),columnLength:ko.observable(4),selectedDepartmentId:ko.observable(),units:ko.observableArray(),user:ko.observable(),cancelUser:d,saveUser:l};return p.selectedDepartmentId.subscribe(function(e){if(""===e||"Choose..."===e||void 0===e)return p.assignmentVMs([]);var t=new breeze.Predicate("name",breeze.FilterQueryOp.Contains,e);return m.roles.find(t).then(function(e){var t=e,n=$.map(t,function(e){return{role:e,isSelected:ko.observable(!1)}});p.assignmentVMs(n)}).fail(function(e){n.logError(e.statusText,e,a.getModuleId(p),!0)}),!0}),p.assignmentVMRows=ko.computed(function(){for(var e,t=[],n=parseInt(p.columnLength(),10),r=0,a=p.assignmentVMs().length;a>r;r++)0===r%n&&(e&&t.push(e),e=[]),e.push(p.assignmentVMs()[r]);return e&&t.push(e),t}),t.includeIn(p),p});
define('viewmodels/users/edit',["global/session","services/errorhandler","services/logger","durandal/system","plugins/router"],function(e,t,n,r,a){function i(e,t){return ga("send","pageview",{page:window.location.href,title:document.title}),console.log("Route dept: "+t.departmentid),h.selectedDepartmentId(t.departmentid),l().then(function(e){h.units(e),h.selectedDepartmentId(e[0].departments()[0].id())}),s(e).then(function(e){h.user(e[0])}).then(function(){return d(t.departmentid)}).then(function(e){h.roles(e)}).then(function(){return c(h.user(),h.roles())}).then(function(e){h.assignmentVMs(e)}),!0}function o(){return h.assignmentVMs([]),h.user(void 0),!0}function s(e){var t=new breeze.Predicate("id","==",e),n="roleAssignments";return v.users.find(t,n).then(function(e){return e})}function l(){return e.userIsInRole("manage-all")?v.units.all().then(function(e){return e}):v.manageableUnits.all().then(function(e){return e})}function d(e){var t=new breeze.Predicate("departmentId","==",e);return v.roles.find(t).then(function(e){return e}).fail(function(e){return n.logError(e.statusText,e,r.getModuleId(h),!0)})}function c(e,t){var n=p(e),r=$.map(t,function(e){return{role:e,isSelected:ko.observable(!!n[e.id()])}});return r}function u(){var e=this;return f(),v.hasChanges()?(v.commit().then(function(e){return n.logSuccess("Save successful",e,r.getModuleId(h),!0)}).fail(e.handleError),!0):n.log("No changes were detected.",null,r.getModuleId(h),!0)}function m(){return v.rollback(),a.navigateBack()}function p(e){var t={};return $.each(e.roleAssignments(),function(e,n){t[n.roleId()]=n}),t}function f(){var e=h.user(),t=h.assignmentVMs(),n=p(e);$.each(t,function(t,r){var a=n[r.role.id()];r.isSelected()?a||(a=v.roleAssignments.create({roleId:r.role.id(),userId:e.id()})):a&&a.entityAspect.setDeleted()})}var v=e.unitofwork(),h={activate:i,deactivate:o,assignmentVMs:ko.observableArray(),columnLength:ko.observable(4),selectedDepartmentId:ko.observable(),roles:ko.observableArray(),units:ko.observableArray(),user:ko.observable(),cancelChanges:m,saveChanges:u};return h.selectedDepartmentId.subscribe(function(e){return console.log("Selected department id: "+e),h.user()&&(console.log("New department id: "+e+". Fetching roles for department."),d(e).then(function(e){h.roles(e)}).then(function(){return c(h.user(),h.roles())}).then(function(e){h.assignmentVMs(e)})),!0}),h.assignmentVMRows=ko.computed(function(){for(var e,t=[],n=parseInt(h.columnLength(),10),r=0,a=h.assignmentVMs().length;a>r;r++)0===r%n&&(e&&t.push(e),e=[]),e.push(h.assignmentVMs()[r]);return e&&t.push(e),t}),t.includeIn(h),h});
define('viewmodels/users/index',["global/session","services/errorhandler","services/logger","plugins/router","durandal/system"],function(e,t,n,r,a){function i(){return ga("send","pageview",{page:window.location.href,title:document.title}),!0}function o(){var t=this;if(e.userIsInRole("manage-all"))s.units.all().then(function(e){l.units(e),l.selectedDepartmentId(e[0].departments()[0].id())});else{var n=s.manageableUnits.all().then(function(e){l.units(e),l.selectedDepartmentId(e[0].departments()[0].id())});Q.all([n]).fail(t.handleError)}return!0}var s=e.unitofwork(),l={activate:i,attached:o,selectedDepartmentId:ko.observable(),units:ko.observableArray(),users:ko.observableArray()};return t.includeIn(l),l.selectedDepartmentId.subscribe(function(e){return""===e||"Choose..."===e||void 0===e?l.users([]):(s.usersByDepartment(e).then(function(e){$.each(e,function(t){e[t].formattedCreatedDate=ko.computed(function(){return moment(e[t].createdDate).format("MM/DD/YYYY")})}),l.users(e)}).fail(function(e){n.logError(e.statusText,e,a.getModuleId(l),!0)}),!0)}),l});
define('text',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});

define('text!views/departments/create.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>NEW DEPARTMENT</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns">\r\n        <section data-bind="with: department">\r\n\r\n            <fieldset>\r\n                <h4>Unit assignment</h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-6 medium-6 columns">\r\n                        <label>\r\n                            Unit\r\n                        </label>\r\n                        <select data-bind="value: unitId">\r\n                            <!-- ko foreach: $parent.units -->\r\n                            <option data-bind="attr: { label: name, value: id }, text: name"></option>\r\n                            <!--/ko-->\r\n                        </select>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n            <fieldset>\r\n                <h4>Department information</h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-5 medium-5 columns">\r\n                        <label>\r\n                            Id<span class="required">*</span>\r\n                            <input type="text" data-bind="value: id" />\r\n                        </label>\r\n                    </div>\r\n\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns">\r\n                        <label>\r\n                            Name<span class="required">*</span>\r\n                            <input type="text" data-bind="value: name" />\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns">\r\n                        <label>\r\n                            Sequence value<span class="required">*</span>\r\n                            <input type="text" data-bind="value: sequenceValue" />\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n            <div class="row">\r\n                <div class="large-12 columns">\r\n                    <span class="save-button" data-bind="click: $parent.saveDepartment">Save</span>\r\n                    <span class="cancel-button" data-bind="click: $parent.cancelDepartment">Cancel</span>\r\n                </div>\r\n            </div>\r\n        </section>\r\n    </div>\r\n</div>\r\n\r\n';});


define('text!views/departments/index.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>DEPARTMENTS</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns">\r\n        <p>\r\n            <a href="/departments/create">Create</a>\r\n        </p>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-6 medium-6 columns">\r\n        <label>\r\n            Department\r\n        </label>\r\n        <select data-bind="value: selectedDepartmentId">\r\n            <!-- ko foreach: units -->\r\n            <optgroup data-bind="attr: { label: name }, foreach: departments">\r\n                <option data-bind="attr: { label: name, value: id }, text: name"></option>\r\n            </optgroup>\r\n            <!--/ko-->\r\n        </select>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="with: selectedDepartment">\r\n    <div class="large-4 columns">\r\n        <section class="department-name-editor">\r\n            <label for="Name">\r\n                Name<span class="required">*</span>\r\n            </label>\r\n\r\n            <input type="text" data-bind="value: name" />\r\n\r\n            <em>Number of employees: </em>\r\n            <span data-bind="text: $parent.employeeCount()"></span>\r\n\r\n            <p data-bind="if: $parent.employeeCount() === 0">\r\n                <a data-bind="click: $parent.deleteDepartment">Delete selected department</a>\r\n            </p>\r\n        </section>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: selectedDepartmentId">\r\n    <div class="large-12 columns">\r\n        <span class="save-button" data-bind="click: saveChanges">Save</span>\r\n        <span class="cancel-button" data-bind="click: cancelChanges">Cancel</span>\r\n    </div>\r\n</div>\r\n';});


define('text!views/employments/edit.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>EDIT EMPLOYMENTS</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns">\r\n        <p>\r\n            <a data-bind="attr: { href: \'/persons/edit-home-department/\' + personId() }">Edit home department</a>\r\n        </p>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns" data-bind="foreach: employmentVMs">\r\n        <fieldset>\r\n            <h4 data-bind="text: unit.name"></h4>\r\n\r\n            <!-- ko foreach: departmentRows -->\r\n            <div class="row" data-bind="foreach: $data">\r\n                <div class="large-4 columns">\r\n                    <label>\r\n                        <input type="checkbox" data-bind="checkedValue: department.id, checked: isSelected" />\r\n                        <span data-bind="text: department.name"></span>\r\n                    </label>\r\n                </div>\r\n            </div>\r\n            <!--/ko-->\r\n        </fieldset>\r\n    </div>\r\n</div>\r\n\r\n<section data-bind="with: employmentVMs">\r\n    <div class="row">\r\n        <div class="large-12 columns">\r\n            <span class="save-button" data-bind="click: $parent.saveChanges">Save</span>\r\n            <span class="cancel-button" data-bind="click: $parent.cancelChanges">Cancel</span>\r\n        </div>\r\n    </div>\r\n</section>\r\n';});


define('text!views/not-found.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>PAGE NOT FOUND</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns">\r\n        <p>The page you are looking for was not found.</p>\r\n    </div>\r\n</div>';});


define('text!views/persons/create.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>NEW EMPLOYEE</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns">\r\n        <section data-bind="with: person">\r\n            <fieldset>\r\n                <h4>Employee information</h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-5 medium-5 columns">\r\n                        <label>\r\n                            Id <input type="text" data-bind="value: id" />\r\n                        </label>\r\n                    </div>\r\n\r\n                    <div class="large-4 large-offset-3 medium-4 medium-offset-3 columns">\r\n                        <label>\r\n                            Status <select data-bind="options: $parent.statusTypes,\r\n                            optionsValue: \'id\', optionsText: \'name\', value: statusTypeId"></select>\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns">\r\n                        <label>\r\n                            Pid <input type="text" data-bind="value: pid" />\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns">\r\n                        <label>\r\n                            First name <input type="text" data-bind="value: firstName" />\r\n                        </label>\r\n                    </div>\r\n\r\n                    <div class="large-4 large-pull-4 medium-4 medium-pull-4 columns">\r\n                        <label>\r\n                            Last name <input type="text" data-bind="value: lastName" />\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n            <fieldset>\r\n                <h4>Employment</h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-6 medium-6 columns">\r\n                        <label>\r\n                            Home department\r\n                        </label>\r\n                        <select data-bind="value: homeDepartmentId">\r\n                            <option selected="selected">Select a department...</option>\r\n                            <!-- ko foreach: $parent.units -->\r\n                            <optgroup data-bind="attr: { label: name }, foreach: departments">\r\n                                <option data-bind="attr: { label: name, value: id }, text: name"></option>\r\n                            </optgroup>\r\n                            <!--/ko-->\r\n                        </select>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n            <fieldset data-bind="foreach: salaries">\r\n                <h4>Salary information</h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns">\r\n                        <p>\r\n                            <label>\r\n                                Cycle year: <span data-bind="text: cycleYear"></span>\r\n                            </label>\r\n                        </p>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns">\r\n                        <label>Leave status</label>\r\n                        <select data-bind="options: $parents[1].leaveTypes,\r\n                            optionsValue: \'id\', optionsText: \'name\', value: leaveTypeId"></select>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns">\r\n                        <label for="FacultyType">\r\n                            Classification\r\n                        </label>\r\n                        <select name="FacultyType" data-bind="options: $parents[1].facultyTypes,\r\n                        optionsValue: \'id\', optionsText: \'name\', value: facultyTypeId"></select>\r\n                    </div>\r\n\r\n                    <div class="large-4 medium-6 columns">\r\n                        <label for="RankType">\r\n                            Rank\r\n                        </label>\r\n                        <select name="RankType" data-bind="options: $parents[1].rankTypes,\r\n                        optionsValue: \'id\', optionsText: \'name\', value: rankTypeId"></select>\r\n                    </div>\r\n\r\n                    <div class="large-4 medium-6 columns">\r\n                        <label for="AppointmentType">\r\n                            Appointment\r\n                        </label>\r\n                        <select name="AppointmentType" data-bind="options: $parents[1].appointmentTypes,\r\n                        optionsValue: \'id\', optionsText: \'name\', value: appointmentTypeId"></select>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-8 medium-6 columns end">\r\n                        <label for="Title" class="hide-on-print">\r\n                            Title\r\n                        </label>\r\n                        <input name="Title" type="text" class="hide-on-print" data-bind="value: title" />\r\n                        <p class="print-only">\r\n                            <span class="text-underline">Title</span>: <span data-bind="text: title"></span>\r\n                        </p>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns end">\r\n                        <label for="FTE" class="hide-on-print">\r\n                            FTE<span class="required">*</span>\r\n                        </label>\r\n                        <input name="FTE" type="text" class="hide-on-print" data-bind="value: fullTimeEquivalent" />\r\n                        <p class="print-only">\r\n                            <span class="text-underline">FTE</span>: <span data-bind="text: fullTimeEquivalent"></span>\r\n                        </p>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns end">\r\n                        <label>\r\n                            Base amount <input type="text" data-bind="value: formattedBaseAmount" />\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns end">\r\n                        <label>\r\n                            Administrative amount <input type="text" data-bind="value: formattedAdminAmount" />\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns end">\r\n                        <label>\r\n                            Eminent amount <input type="text" data-bind="value: formattedEminentAmount" />\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 medium-4 columns end">\r\n                        <label>\r\n                            Promotion amount <input type="text" data-bind="value: formattedPromotionAmount" />\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n            <div class="row">\r\n                <div class="large-12 columns">\r\n                    <span class="save-button" data-bind="click: $parent.savePerson">Save</span>\r\n                    <span class="cancel-button" data-bind="click: $parent.cancelPerson">Cancel</span>\r\n                </div>\r\n            </div>\r\n        </section>\r\n    </div>\r\n</div>\r\n\r\n';});


define('text!views/persons/edit-home-department.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>EDIT HOME DEPARTMENT</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns">\r\n        <section>\r\n            <fieldset>\r\n                <h4>\r\n                    Home department\r\n                </h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-6 medium-6 columns">\r\n                        <select data-bind="value: person().homeDepartmentId">\r\n                            <!-- ko foreach: units -->\r\n                            <optgroup data-bind="attr: { label: name }, foreach: departments">\r\n                                <option data-bind="attr: { label: name, value: id }, text: name"></option>\r\n                            </optgroup>\r\n                            <!--/ko-->\r\n                        </select>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n            <div class="row">\r\n                <div class="large-12 columns">\r\n                    <span class="save-button" data-bind="click: saveChanges">Save</span>\r\n                    <span class="cancel-button" data-bind="click: cancelChanges">Cancel</span>\r\n                </div>\r\n            </div>\r\n        </section>\r\n    </div>\r\n</div>\r\n\r\n';});


define('text!views/reports/base-salary-adjustment.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>BASE SALARY ADJUSTMENT REPORT</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns table-container">\r\n        <table data-bind="if: departmentData().length > 0">\r\n            <!-- ko foreach: departmentData -->\r\n            <tbody class="department-heading">\r\n                <tr>\r\n                    <td colspan="7" class="text-center" data-bind="text: department.name"></td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody class="thead" data-bind="if: adjustments.length > 0">\r\n                <tr>\r\n                    <td>\r\n                        Name\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Rank\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Appointment\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        FTE\r\n                    </td>\r\n                    <td>\r\n                        Starting Base\r\n                    </td>\r\n                    <td>\r\n                        New Base\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody data-bind="if: adjustments.length === 0">\r\n                <tr>\r\n                    <td>\r\n                        No records\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody data-bind="foreach: adjustments">\r\n                <tr>\r\n                    <td>\r\n                        <a data-bind="attr: { href: \'salaries/edit/\' + id() }, text: person().firstName() + \' \' + person().lastName()"></a>\r\n                    </td>\r\n                    <td class="hide-for-small-down" data-bind="text: rankType().name"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: appointmentType().name"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: fullTimeEquivalent"></td>\r\n                    <td data-bind="text: formattedBannerBaseAmount"></td>\r\n                    <td data-bind="text: formattedBaseAmount"></td>\r\n                </tr>\r\n            </tbody>\r\n            <!--/ko-->\r\n        </table>\r\n    </div>\r\n</div>\r\n';});


define('text!views/reports/fo-export.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>Fiscal officer export</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: departmentData().length > 0">\r\n    <div class="large-12 columns">\r\n        <p>\r\n            <a data-bind="click: downloadExcel">Download Excel version</a>\r\n        </p>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns table-container">\r\n        <table data-bind="if: departmentData().length > 0">\r\n            <!-- ko foreach: departmentData -->\r\n            <tbody class="department-heading">\r\n                <tr>\r\n                    <td colspan="10" class="text-center" data-bind="text: department.name"></td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody class="thead" data-bind="if: salaries.length > 0">\r\n                <tr>\r\n                    <td>\r\n                        Name\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Status\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Rank\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Appointment\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        FTE\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Salary\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Merit\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Special\r\n                    </td>\r\n                    <td>\r\n                        Total\r\n                    </td>\r\n                    <td>\r\n                        Change\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody data-bind="if: salaries.length === 0">\r\n                <tr>\r\n                    <td>\r\n                        No records\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody data-bind="foreach: salaries">\r\n                <tr>\r\n                    <td>\r\n                        <a data-bind="attr: { href: \'salaries/edit/\' + id() }, text: person().firstName() + \' \' + person().lastName()"></a>\r\n                    </td>\r\n                    <td class="hide-for-small-down" data-bind="text: person().statusType().name"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: rankType().name"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: appointmentType().name"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: fullTimeEquivalent"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedTotalAmount"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedMeritIncrease"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedSpecialIncrease"></td>\r\n                    <td data-bind="text: formattedNewTotalAmount"></td>\r\n                    <td data-bind="text: formattedPercentIncrease"></td>\r\n                </tr>\r\n            </tbody>\r\n            <!--/ko-->\r\n        </table>\r\n    </div>\r\n</div>\r\n';});


define('text!views/reports/index.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>REPORTING</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-4 medium-6 columns end">\r\n        <label>\r\n            Report\r\n        </label>\r\n        <select data-bind="options: reportTypes, optionsText: \'text\', optionsValue: \'route\', value: selectedReportType"></select>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-4 medium-6 columns end">\r\n        <label>\r\n            Audience\r\n        </label>\r\n        <select data-bind="options: audienceTypes, value: selectedAudienceType"></select>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: selectedAudienceType() === \'Unit\'">\r\n    <div class="large-6 medium-6 columns end">\r\n        <label>\r\n            Unit\r\n        </label>\r\n        <select data-bind="options: units,\r\n                optionsText: \'name\', optionsValue: \'id\', optionsCaption: \'Choose...\',\r\n                value: selectedUnitId"></select>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: selectedAudienceType() === \'Department\'">\r\n    <div class="large-6 medium-6 columns end">\r\n        <label for="Unit">\r\n            Department\r\n            <select data-bind="value: selectedDepartmentId">\r\n                <!-- ko foreach: units -->\r\n                <optgroup data-bind="attr: { label: name }, foreach: departments">\r\n                    <option data-bind="attr: { label: name, value: unitId() + \'/\' + id() }, text: name"></option>\r\n                </optgroup>\r\n                <!--/ko-->\r\n            </select>\r\n        </label>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns">\r\n        <span class="save-button" data-bind="click: generateReport">Generate report</span>\r\n    </div>\r\n</div>\r\n';});


define('text!views/reports/meeting.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>MEETING REPORT</span></h2>\r\n    </div>\r\n</div>\r\n<div class="row" data-bind="if: departmentData().length > 0">\r\n    <div class="large-12 columns">\r\n        <p>\r\n            <a data-bind="click: downloadExcel">Download Excel version</a>\r\n        </p>\r\n\r\n        <p data-bind="ifIsInRole: \'manage-all\'">\r\n            <label><input type="checkbox" data-bind="checked: isExecutiveExcel" /> Include executive Excel columns</label>\r\n        </p>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: departmentData().length > 0">\r\n    <div class="large-12 columns table-container">\r\n        <table>\r\n            <!-- ko foreach: departmentData -->\r\n            <tbody class="department-heading">\r\n                <tr>\r\n                    <td colspan="10" class="text-center" data-bind="text: department.name"></td>\r\n                </tr>\r\n            </tbody>\r\n            <tbody class="thead" data-bind="if: salaries.length > 0">\r\n                <tr>\r\n                    <td>\r\n                        Name\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Rank\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Appointment\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        FTE\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Salary\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Merit\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Special\r\n                    </td>\r\n                    <td>\r\n                        Total\r\n                    </td>\r\n                    <td>\r\n                        Change\r\n                    </td>\r\n                    <td class="hide-for-small-down text-center">\r\n                        Comments\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n            <tbody data-bind="if: salaries.length === 0">\r\n                <tr>\r\n                    <td>\r\n                        No records\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n            <tbody data-bind="foreach: salaries">\r\n                <tr>\r\n                    <td>\r\n                        <a data-bind="attr: { href: \'salaries/edit/\' + id() }, text: person().firstName() + \' \' + person().lastName()"></a>\r\n                    </td>\r\n                    <td class="small-2 hide-for-small-down" data-bind="text: rankType().name"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: appointmentType().name"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: fullTimeEquivalent"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedTotalAmount"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedMeritIncrease"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedSpecialIncrease"></td>\r\n                    <td data-bind="text: formattedNewTotalAmount"></td>\r\n                    <td data-bind="text: formattedPercentIncrease"></td>\r\n                    <td class="hide-for-small-down text-center"><a data-bind="click: $root.showComments">View</a></td>\r\n                </tr>\r\n            </tbody>\r\n            <!--/ko-->\r\n        </table>\r\n\r\n        <div id="Comments" class="small reveal-modal" data-reveal>\r\n\r\n            <!-- ko ifnot: meritAdjustmentNoteComment -->\r\n            <!-- ko ifnot: specialAdjustmentNoteComment -->\r\n            <h2 class="title-comments">No Comments</h2>\r\n            <!--/ko-->\r\n            <!--/ko-->\r\n            <!-- ko if: (( meritAdjustmentNoteComment ) ||( specialAdjustmentNoteComment )) -->\r\n            <h2 class="title-comments">Comments</h2>\r\n            <!--/ko-->\r\n            <!-- ko if: meritAdjustmentNoteComment -->\r\n            <p class="category">Merit Adjustment</p>\r\n            <p class="category-content" data-bind="text : meritAdjustmentTypeComment"></p>\r\n            <p class="category">Merit Adjustment Comments</p>\r\n            <p class="category-content" data-bind="text : meritAdjustmentNoteComment"></p>\r\n            <!--/ko-->\r\n            <!-- ko if: specialAdjustmentNoteComment -->\r\n            <p class="category">Special Adjustment:</p>\r\n            <!-- ko foreach: specialAdjustmentTypesComment -->\r\n            <p class="category-content">&#149; <span data-bind="text : specialAdjustmentType().name"></span></p>\r\n            <!--/ko-->\r\n            <p class="category">Special Adjustment Comments</p>\r\n            <p class="category-content" data-bind="text : specialAdjustmentNoteComment"></p>\r\n            <!--/ko-->\r\n\r\n            <a class="close-reveal-modal">&#215;</a>\r\n        </div>\r\n\r\n    </div>\r\n</div>\r\n';});


define('text!views/reports/merit-summary-report.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>Merit Summary Report</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: summaryMerit().length > 0">\r\n    <div class="large-12 columns">\r\n        <p>\r\n            <a data-bind="click: downloadExcel">Download Excel version</a>\r\n        </p>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns table-container">\r\n        <table data-bind="if: summaryMerit().length > 0">\r\n            <!-- ko foreach: summaryMerit -->\r\n            <tbody class="department-heading">\r\n                <tr>\r\n                    <td colspan="6" class="text-center" data-bind="text: department"></td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody class="thead">\r\n                <tr class="results">\r\n                    <td class="text-center">\r\n                        Highest  increase\r\n                    </td>\r\n                    <td class="text-center">\r\n                        Highest  percentage\r\n                    </td>\r\n                    <td class="text-center">\r\n                        Median  increase\r\n                    </td>\r\n                    <td class="text-center">\r\n                        Mean increase\r\n                    </td>\r\n                    <td class="text-center">\r\n                        Lowest increase\r\n                    </td>\r\n                    <td class="text-center">\r\n                        Lowest percentage\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody>\r\n                <tr class="results">\r\n                    <td class="text-center"\r\n                        data-bind="text: highestMerit.formattedMeritIncrease"></td>\r\n                    <td class="text-center"\r\n                        data-bind="text: highestMerit.formattedPercentIncrease"></td>\r\n                    <td class="text-center"\r\n                        data-bind="text: medianMerit"></td>\r\n                    <td class="text-center"\r\n                        data-bind="text: meanMerit"></td>\r\n                    <td class="text-center"\r\n                        data-bind="text: lowestMerit.formattedMeritIncrease"></td>\r\n                    <td class="text-center"\r\n                        data-bind="text: lowestMerit.formattedPercentIncrease"></td>\r\n\r\n                </tr>\r\n            </tbody>\r\n            <!--/ko-->\r\n        </table>\r\n    </div>\r\n</div>';});


define('text!views/reports/multiple-employments.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>MULTIPLE DEPARTMENTS REPORT</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns table-container">\r\n        <table data-bind="if: departmentData().length > 0">\r\n            <!-- ko foreach: departmentData -->\r\n            <tbody class="department-heading">\r\n                <tr>\r\n                    <td class="text-center" data-bind="text: department.name"></td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody class="thead" data-bind="if: data.length > 0">\r\n                <tr>\r\n                    <td>\r\n                        Name\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody data-bind="if: data.length === 0">\r\n                <tr>\r\n                    <td>\r\n                        No records\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody data-bind="foreach: data">\r\n                <tr>\r\n                    <td>\r\n                        <a data-bind="attr: { href: \'salaries/edit/\' + salaryId },\r\n                            text: fullName"></a>\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n            <!--/ko-->\r\n        </table>\r\n    </div>\r\n</div>\r\n';});


define('text!views/reports/role-assignment.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>USER ROLES REPORT</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: departmentData().length > 0">\r\n    <div class="large-12 columns table-container">\r\n        <table data-bind="foreach: departmentData">\r\n            <tbody class="department-heading">\r\n                <tr>\r\n                    <td colspan="10" class="text-center" data-bind="text: department.name"></td>\r\n                </tr>\r\n            </tbody>\r\n            <!-- ko foreach: roles -->\r\n            <tbody class="thead">\r\n                <tr>\r\n                    <td data-bind="text: name">\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n            <tbody data-bind="if: roleAssignments().length === 0">\r\n                <tr>\r\n                    <td>\r\n                        No records\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n            <tbody data-bind="foreach: roleAssignments">\r\n                <tr>\r\n                    <td>\r\n                        <a data-bind="attr: { href: \'/users/edit/\' + user().id() + \'?departmentid=\' + $parent.departmentId() }, text: user().pid"></a>\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n            <!--/ko-->\r\n        </table>\r\n    </div>\r\n</div>\r\n';});


define('text!views/reports/salaries-by-faculty-type.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>SALARIES BY FACULTY TYPE REPORT</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: departmentData().length > 0">\r\n    <div class="large-12 columns">\r\n        <p>\r\n            <a data-bind="click: downloadExcel">Download Excel version</a>\r\n        </p>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns table-container">\r\n        <table data-bind="if: departmentData().length > 0">\r\n            <!-- ko foreach: departmentData -->\r\n            <tbody class="department-heading">\r\n                <tr>\r\n                    <td colspan="6" class="text-center" data-bind="text: department.name"></td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody data-bind="if: data.length === 0">\r\n                <tr>\r\n                    <td>\r\n                        No records\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody class="thead" data-bind="if: data.length > 0">\r\n                <tr>\r\n                    <td>\r\n                        Type\r\n                    </td>\r\n                    <td>\r\n                        Starting salaries\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Merit increases\r\n                    </td>\r\n                    <td class="hide-for-small-down">\r\n                        Special increases\r\n                    </td>\r\n                    <td>\r\n                        New salaries\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody data-bind="foreach: data">\r\n                <tr>\r\n                    <td data-bind="text: facultyType[0]"></td>\r\n                    <td data-bind="text: formattedStartingSalaries"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedMeritIncreases"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedSpecialIncreases"></td>\r\n                    <td data-bind="text: formattedNewSalaries"></td>\r\n                </tr>\r\n            </tbody>\r\n            <!--/ko-->\r\n        </table>\r\n    </div>\r\n</div>\r\n';});


define('text!views/reports/unreviewed.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>UNREVIEWED SALARY REPORT</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns table-container">\r\n        <table data-bind="if: departmentData().length > 0">\r\n            <!-- ko foreach: departmentData -->\r\n            <tbody class="department-heading">\r\n                <tr>\r\n                    <td class="text-center" data-bind="text: department.name"></td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody data-bind="if: salaries.length === 0">\r\n                <tr>\r\n                    <td>\r\n                        No records\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody class="thead" data-bind="if: salaries.length > 0">\r\n                <tr>\r\n                    <td>Name</td>\r\n                </tr>\r\n            </tbody>\r\n\r\n            <tbody data-bind="foreach: salaries">\r\n                <tr>\r\n                    <td>\r\n                        <a data-bind="attr: { href: \'salaries/edit/\' + id() }, text: person().firstName() + \' \' + person().lastName()"></a>\r\n                    </td>\r\n                </tr>\r\n            </tbody>\r\n            <!--/ko-->\r\n        </table>\r\n    </div>\r\n</div>\r\n';});


define('text!views/salaries/edit.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>EDIT SALARY</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns">\r\n        <section data-bind="with: salary">\r\n            <fieldset>\r\n                <div class="row">\r\n                    <div class="large-8 medium-6 columns">\r\n                        <h4 data-bind="text: person().firstName() + \' \' + person().lastName() + \' | \' + person().id()"></h4>\r\n                    </div>\r\n\r\n                    <section data-bind="ifIsInRole: \'manage-all\'">\r\n                        <div class="large-2 large-offset-2 medium-4 medium-offset-2 columns hide-for-small">\r\n                            <select data-bind="options: $parent.statusTypes,\r\n                            optionsValue: \'id\', optionsText: \'name\', optionsCaption: \'Choose...\', value: person().statusTypeId"></select>\r\n                        </div>\r\n                    </section>\r\n\r\n                    <section data-bind="ifNotIsInRole: \'manage-all\'">\r\n                        <div class="large-2 large-offset-2 medium-4 medium-offset-2 columns hide-for-small">\r\n                            <span class="right" data-bind="text: person().statusType().name()"></span>\r\n                        </div>\r\n                    </section>\r\n                </div>\r\n\r\n                <div class="row" data-bind="ifNotIsInRole: \'manage-all\'">\r\n                    <div class="large-4 columns hide-for-small end" data-bind="if: leaveTypeId() > 1">\r\n                        <p data-bind="text: \'Leave status: \' + leaveType().name()"></p>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row" data-bind="ifIsInRole: \'manage-all\'">\r\n                    <div class="large-4 medium-6 columns hide-for-small">\r\n                        <label>Leave status</label>\r\n                        <select data-bind="options: $parent.leaveTypes,\r\n                            optionsValue: \'id\', optionsText: \'name\', optionsCaption: \'Choose...\', value: leaveTypeId"></select>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row" data-bind="ifNotIsInRole: \'manage-all\'">\r\n                    <div class="large-2 medium-2 small-6 columns">\r\n                        <label>Starting salary</label>\r\n                        <p data-bind="text: formattedTotalAmount"></p>\r\n                    </div>\r\n\r\n                    <div class="large-2 medium-2 small-6 columns">\r\n                        <label>New salary</label>\r\n                        <p data-bind="text: formattedNewTotalAmount"></p>\r\n                    </div>\r\n\r\n                    <div class="large-2 medium-2 small-6 columns"\r\n                         data-bind="if: adminAmount() > 0 || eminentAmount() > 0 || promotionAmount() > 0">\r\n                        <label>Base salary</label>\r\n                        <p data-bind="text: formattedBaseAmount"></p>\r\n                    </div>\r\n\r\n                    <div class="large-2 medium-2 small-6 columns" data-bind="if: adminAmount() > 0">\r\n                        <label>Admin salary</label>\r\n                        <p data-bind="text: formattedAdminAmount"></p>\r\n                    </div>\r\n\r\n                    <div class="large-2 medium-2 small-6 columns" data-bind="if: eminentAmount() > 0">\r\n                        <label>Eminent salary</label>\r\n                        <p data-bind="text: formattedEminentAmount"></p>\r\n                    </div>\r\n\r\n                    <div class="large-2 medium-2 small-6 columns" data-bind="if: promotionAmount() > 0">\r\n                        <label>Promotion amount</label>\r\n                        <p data-bind="text: formattedPromotionAmount"></p>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row" data-bind="ifIsInRole: \'manage-all\'">\r\n                    <div class="large-2 medium-4 small-6 columns">\r\n                        <label>Starting salary</label>\r\n                        <p data-bind="text: formattedTotalAmount"></p>\r\n                    </div>\r\n\r\n                    <div class="large-2 medium-4 small-6 columns">\r\n                        <label>New salary</label>\r\n                        <p data-bind="text: formattedNewTotalAmount"></p>\r\n                    </div>\r\n\r\n                    <div class="large-2 medium-4 small-6 columns">\r\n                        <label>\r\n                            Base salary\r\n                            <input type="text" data-bind="value: formattedBaseAmount" />\r\n                        </label>\r\n                    </div>\r\n\r\n                    <div class="large-2 medium-4 small-6 columns">\r\n                        <label>\r\n                            Admin salary\r\n                            <input type="text" data-bind="value: formattedAdminAmount" />\r\n                        </label>\r\n                    </div>\r\n\r\n                    <div class="large-2 medium-4 small-6 columns">\r\n                        <label>\r\n                            Eminent salary\r\n                            <input type="text" data-bind="value: formattedEminentAmount" />\r\n                        </label>\r\n                    </div>\r\n\r\n                    <div class="large-2  medium-4 small-6 columns">\r\n                        <label>\r\n                            Promotion amount\r\n                            <input type="text" data-bind="value: formattedPromotionAmount" />\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row hide-on-print">\r\n                    <div class="large-4 medium-6 columns">\r\n                        <label>\r\n                            Classification\r\n                        </label>\r\n                        <select data-bind="options: $parent.facultyTypes,\r\n                        optionsValue: \'id\', optionsText: \'name\', optionsCaption: \'Choose...\', value: facultyTypeId"></select>\r\n                    </div>\r\n\r\n                    <div class="large-4 medium-6 columns">\r\n                        <label>\r\n                            Rank\r\n                        </label>\r\n                        <select data-bind="options: $parent.rankTypes,\r\n                        optionsValue: \'id\', optionsText: \'name\', optionsCaption: \'Choose...\', value: rankTypeId"></select>\r\n                    </div>\r\n\r\n                    <div class="large-4 medium-6 columns">\r\n                        <label>\r\n                            Appointment\r\n                        </label>\r\n                        <select data-bind="options: $parent.appointmentTypes,\r\n                        optionsValue: \'id\', optionsText: \'name\', optionsCaption: \'Choose...\', value: appointmentTypeId"></select>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-8 medium-6 columns">\r\n                        <label class="hide-on-print">\r\n                            Title\r\n                            <input name="Title" type="text" class="hide-on-print" data-bind="value: title" />\r\n                        </label>\r\n                        <p class="print-only">\r\n                            <span class="text-underline">Title</span>: <span data-bind="text: title"></span>\r\n                        </p>\r\n                    </div>\r\n\r\n                    <div class="large-3 medium-4 small-6 columns end">\r\n                        <label class="hide-on-print">\r\n                            Full-time equivalent<span class="required">*</span>\r\n                            <input type="text" class="hide-on-print" data-bind="value: fullTimeEquivalent" />\r\n                        </label>\r\n                        <p class="print-only">\r\n                            <span class="text-underline">FTE</span>: <span data-bind="text: fullTimeEquivalent"></span>\r\n                        </p>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n            <fieldset>\r\n                <div class="row">\r\n                    <div class="large-8 small-6 columns">\r\n                        <h4>Funding</h4>\r\n                    </div>\r\n\r\n                    <div class="large-4 small-6 columns">\r\n                        <p class="right" data-bind="ifIsInRole: \'manage-all\'">\r\n                            <a data-bind="attr: { href: \'employments/edit/\' + person().id() }">Edit</a>\r\n                        </p>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-12 columns">\r\n                        <ul data-bind="foreach: $parent.employments">\r\n                            <li data-bind="text: department().name"></li>\r\n                        </ul>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n            <fieldset>\r\n                <h4 data-magellan-destination="merit">Merit adjustment</h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 small-6 columns">\r\n                        <label class="hide-on-print">\r\n                            Amount<span class="required">*</span>\r\n                            <input type="text" class="hide-on-print"\r\n                                   data-bind="value: formattedMeritIncrease" />\r\n                        </label>\r\n                        <p class="print-only">\r\n                            <span class="text-underline">Amount</span>: <span data-bind="text: formattedMeritIncrease"></span>\r\n                        </p>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-1 medium-1 small-3 columns">\r\n                        <label>Change</label>\r\n                        <span data-bind="text: meritPercentIncrease() + \'%\'"></span>\r\n                    </div>\r\n                    <div class="large-6 medium-6 small-9 end columns">\r\n                        <div class="edit-salary-slider" style="margin: 10px" data-bind="currencySlider: meritPercentIncrease, sliderOptions: {min: 0, max: 15, range: \'min\', step: 0.1}, currencyObservable: formattedMeritIncrease, totalObservable: totalAmount"></div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row hide-on-print">\r\n                    <div class="large-4 medium-8 columns end">\r\n                        <label>\r\n                            Adjustment reason\r\n                            <span class="required">*</span>\r\n                        </label>\r\n                        <select data-bind="options: $parent.meritAdjustmentTypes,\r\n                        optionsValue: \'id\', optionsText: \'name\', optionsCaption: \'Choose...\', value: meritAdjustmentTypeId"></select>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-12 columns">\r\n                        <label class="hide-on-print">\r\n                            Brief description of the adjustment\r\n                            <span class="required" data-bind="visible: isMeritAdjustmentNoteRequired">*</span>\r\n                            <textarea class="hide-on-print"\r\n                                      data-bind="value: meritAdjustmentNote"></textarea>\r\n                        </label>\r\n                        <p class="print-only">\r\n                            <span class="text-underline">Brief description of the merit adjustment</span>\r\n                        </p>\r\n                        <p class="print-only" data-bind="text: meritAdjustmentNote"></p>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n            <fieldset data-bind="visible: facultyTypeId() !== 2">\r\n                <h4>Special adjustment</h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-4 small-6 columns">\r\n                        <label class="hide-on-print">\r\n                            Amount<span class="required">*</span>\r\n                            <input type="text" class="hide-on-print"\r\n                                   data-bind="value: formattedSpecialIncrease" />\r\n                        </label>\r\n                        <p class="print-only">\r\n                            <span class="text-underline">Amount</span>: <span data-bind="text: formattedSpecialIncrease"></span>\r\n                        </p>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-1 medium-1 small-3 columns">\r\n                        <label>Change</label>\r\n                        <span data-bind="text: specialPercentIncrease() + \'%\'"></span>\r\n                    </div>\r\n                    <div class="large-6 medium-6 small-9 end columns">\r\n                        <div class="edit-salary-slider" style="margin: 10px" data-bind="currencySlider: specialPercentIncrease,\r\n                            sliderOptions: {min: 0, max: 15, range: \'min\', step: 0.1},\r\n                            currencyObservable: formattedSpecialIncrease, totalObservable: totalAmount"></div>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row hide-on-print">\r\n                    <div class="large-4 columns end">\r\n                        <h5>\r\n                            Adjustments\r\n                            <span class="required" data-bind="visible: isSpecialAdjustmentNoteRequired">*</span>\r\n                        </h5>\r\n                        <!-- ko foreach: $parent.adjustmentVMs -->\r\n                        <div>\r\n                            <label>\r\n                                <input type="checkbox" data-bind="checkedValue: adjustment, checked: isSelected" /> <span data-bind="text: adjustment.name"></span>\r\n                            </label>\r\n                        </div>\r\n                        <!--/ko-->\r\n                        <span class="error" data-bind="validationMessage: specialSalaryAdjustments"></span>\r\n                    </div>\r\n                </div>\r\n\r\n                <div class="row">\r\n                    <div class="large-12 columns">\r\n                        <label class="hide-on-print">\r\n                            Brief description of the adjustment\r\n                            <span class="required" data-bind="visible: isSpecialAdjustmentNoteRequired">*</span>\r\n                            <textarea class="hide-on-print"\r\n                                      data-bind="value: specialAdjustmentNote"></textarea>\r\n                        </label>\r\n                        <p class="print-only">\r\n                            <span class="text-underline">Brief description of the special adjustment</span>\r\n                        </p>\r\n                        <p class="print-only" data-bind="text: specialAdjustmentNote"></p>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n            <div class="row">\r\n                <div class="large-12 columns">\r\n                    <span class="save-button" data-bind="click: $parent.saveChanges">Save</span>\r\n                    <span class="cancel-button" data-bind="click: $parent.cancelChanges">Cancel</span>\r\n                </div>\r\n            </div>\r\n        </section>\r\n    </div>\r\n</div>\r\n';});


define('text!views/salaries/index.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>SALARIES</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-6 medium-6 columns">\r\n        <label>\r\n            Department\r\n        </label>\r\n        <select data-bind="value: selectedDepartmentId">\r\n            <!-- ko foreach: units -->\r\n            <optgroup data-bind="attr: { label: name }, foreach: departments">\r\n                <option data-bind="attr: { label: name, value: id }, text: name"></option>\r\n            </optgroup>\r\n            <!--/ko-->\r\n        </select>\r\n    </div>\r\n\r\n    <div class="large-2 large-offset-4 medium-2 medium-offset-2 hide-for-small columns">\r\n        <label>\r\n            Faculty status\r\n        </label>\r\n        <select data-bind="options: statusTypes,\r\n            optionsValue: \'id\', optionsText: \'name\', value: selectedStatusTypeId"></select>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: salaries().length > 0">\r\n    <div class="large-12 columns table-container">\r\n        <table>\r\n            <thead>\r\n                <tr>\r\n                    <th>\r\n                        Name\r\n                    </th>\r\n                    <th class="hide-for-small-down">\r\n                        Rank\r\n                    </th>\r\n                    <th class="hide-for-small-down">\r\n                        Salary\r\n                    </th>\r\n                    <th class="hide-for-small-down">\r\n                        Merit\r\n                    </th>\r\n                    <th class="hide-for-small-down">\r\n                        Special\r\n                    </th>\r\n                    <th>\r\n                        Total\r\n                    </th>\r\n                    <th>\r\n                        Change\r\n                    </th>\r\n                </tr>\r\n            </thead>\r\n\r\n            <tbody data-bind="foreach: salaries">\r\n                <tr>\r\n                    <td>\r\n                        <a data-bind="attr: { href: \'salaries/edit/\' + id() }, text: person().firstName() + \' \' + person().lastName()"></a>\r\n                    </td>\r\n                    <td class="hide-for-small-down" data-bind="text: rankType().name"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedTotalAmount"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedMeritIncrease"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedSpecialIncrease"></td>\r\n                    <td data-bind="text: formattedNewTotalAmount"></td>\r\n                    <td data-bind="text: formattedPercentIncrease"></td>\r\n                </tr>\r\n            </tbody>\r\n        </table>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: salaries().length === 0">\r\n    <div class="large-12 columns">\r\n        <p>\r\n            No records\r\n        </p>\r\n    </div>\r\n</div>';});


define('text!views/salaries/search.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>SEARCH SALARIES</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-8 medium-8 columns end">\r\n        <label>\r\n            Search for faculty members\' salaries\r\n            <input type="text" placeholder="Search"\r\n                   data-bind="value: instantaneousSearchString, valueUpdate: \'afterkeydown\'">\r\n        </label>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: searchResults().length > 0 && throttledSearchString().length > 0">\r\n    <div class="large-12 columns table-container">\r\n        <table>\r\n            <thead>\r\n                <tr>\r\n                    <th>\r\n                        Name\r\n                    </th>\r\n                    <th class="hide-for-small-down">\r\n                        Rank\r\n                    </th>\r\n                    <th class="hide-for-small-down">\r\n                        Salary\r\n                    </th>\r\n                    <th class="hide-for-small-down">\r\n                        Merit\r\n                    </th>\r\n                    <th class="hide-for-small-down">\r\n                        Special\r\n                    </th>\r\n                    <th>\r\n                        Total\r\n                    </th>\r\n                    <th>\r\n                        Change\r\n                    </th>\r\n                </tr>\r\n            </thead>\r\n            <tbody data-bind="foreach: searchResults">\r\n                <tr>\r\n                    <td>\r\n                        <a data-bind="attr: { href: \'salaries/edit/\' + id() }, text: person().firstName() + \' \' + person().lastName()"></a>\r\n                    </td>\r\n                    <td class="hide-for-small-down" data-bind="text: rankType().name"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedTotalAmount"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedMeritIncrease"></td>\r\n                    <td class="hide-for-small-down" data-bind="text: formattedSpecialIncrease"></td>\r\n                    <td data-bind="text: formattedNewTotalAmount"></td>\r\n                    <td data-bind="text: formattedPercentIncrease"></td>\r\n                </tr>\r\n            </tbody>\r\n        </table>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: searchResults().length === 0 && throttledSearchString().length > 0 && !isSearching()">\r\n    <div class="large-12 columns">\r\n        No records\r\n    </div>\r\n</div>';});


define('text!views/settings/index.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>SETTINGS</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-11 large-offset-1 columns">\r\n        <h5>\r\n            Departments\r\n        </h5>\r\n\r\n        <ul>\r\n            <li>\r\n                <a href="/departments/create">Create</a>\r\n            </li>\r\n            <li>\r\n                <a href="/departments">Edit</a>\r\n            </li>\r\n        </ul>\r\n\r\n        <h5>\r\n            People\r\n        </h5>\r\n\r\n        <ul>\r\n            <li>\r\n                <a href="/persons/create">Create</a>\r\n            </li>\r\n        </ul>\r\n    </div>\r\n</div>\r\n';});


define('text!views/shell.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <a href="/">\r\n            <h1>FacSal</h1>\r\n        </a>\r\n    </div>\r\n</div>\r\n\r\n<div class="contain-to-grid hide-on-print">\r\n    <nav class="top-bar" data-topbar data-options="is_hover: false" role="navigation">\r\n        <ul class="title-area">\r\n            <li class="name">\r\n            </li>\r\n            <li class="toggle-topbar"><a><span>Menu</span></a></li>\r\n        </ul>\r\n\r\n        <section class="top-bar-section">\r\n            <ul class="right">\r\n                <!-- ko foreach: router.navigationModel -->\r\n                <li class="menu-item">\r\n                    <a data-bind="attr: { href: $parent.router.convertRouteToHash(hash) }, text: title"></a>\r\n                </li>\r\n                <!--/ko-->\r\n\r\n                <li class="menu-item"\r\n                    data-bind="ifIsInRole: [\'manage-users\', \'manage-all\']">\r\n                    <a href="/users/index">Users</a>\r\n                </li>\r\n\r\n                <li class="menu-item"\r\n                    data-bind="ifIsInRole: \'manage-all\'">\r\n                    <a href="/settings/index">\r\n                        <i class="fa fa-gears fa-lg"></i>\r\n                    </a>\r\n                </li>\r\n                \r\n                <li class="menu-item">\r\n                    <a data-bind="click: logOut">Log out</a>\r\n                </li>\r\n            </ul>\r\n        </section>\r\n    </nav>\r\n</div>\r\n\r\n<section id="content" data-bind="router: { cacheViews: true, alwaysTriggerAttach:true }"></section>\r\n\r\n<div id="timeoutModal" class="small reveal-modal" data-reveal>\r\n    <h4>Your session is about to time out.</h4>\r\n    <p>\r\n        You will be logged out in <span class="counter"></span> seconds. Click continue to\r\n        extend your session.\r\n    </p>\r\n\r\n    <span class="save-button button-close-reveal-modal">Continue</span>\r\n\r\n    <a class="close-reveal-modal">&#215;</a>\r\n</div>\r\n\r\n<footer>\r\n    <div class="row copyright">\r\n        <div class="small-12 medium-6 large-6 columns">\r\n            Copyright &copy;2014 Virginia Tech\r\n        </div>\r\n\r\n        <div class="small-12 columns show-for-small small-attribution hide-for-print">\r\n            Developed by <a href="http://www.linkedin.com/in/chrisjsherm/‎">Chris Sherman</a>\r\n        </div>\r\n        <div class="medium-4 large-6 columns hide-for-small text-right">\r\n            Developed by <a href="http://www.linkedin.com/in/chrisjsherm/">Chris Sherman</a>\r\n        </div>\r\n    </div>\r\n</footer>\r\n';});


define('text!views/users/create.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>NEW USER</span></h2>\r\n    </div>\r\n</div>\r\n\r\n\r\n<div class="row">\r\n    <div class="large-12 columns">\r\n        <section data-bind="with: user">\r\n            <fieldset>\r\n                <h4>User information</h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-5 medium-7 columns end">\r\n                        <label>\r\n                            Pid\r\n                            <input type="text" data-bind="value: pid" />\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n\r\n\r\n            <fieldset>\r\n                <h4>Departmental roles</h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-6 medium-8 columns end">\r\n                        <label for="Unit">\r\n                            Department\r\n                        </label>\r\n                        <select data-bind="value: $parent.selectedDepartmentId">\r\n                            <!-- ko foreach: $parent.units -->\r\n                            <optgroup data-bind="attr: { label: name }, foreach: departments">\r\n                                <option data-bind="attr: { label: name, value: id }, text: name"></option>\r\n                            </optgroup>\r\n                            <!--/ko-->\r\n                        </select>\r\n                    </div>\r\n                </div>\r\n\r\n                <!-- ko foreach: $parent.assignmentVMRows -->\r\n                    <div class="row" data-bind="foreach: $data">\r\n                        <div class="large-3 columns">\r\n                            <label>\r\n                                <input type="checkbox" data-bind="checkedValue: role, checked: isSelected" />\r\n                                <span data-bind="text: role.name"></span>\r\n                            </label>\r\n                        </div>\r\n                    </div>\r\n                <!--/ko-->\r\n            </fieldset>\r\n\r\n            <div class="row">\r\n                <div class="large-12 columns">\r\n                    <span class="save-button" data-bind="click: $parent.saveUser">Save</span>\r\n                    <span class="cancel-button" data-bind="click: $parent.cancelUser">Cancel</span>\r\n                </div>\r\n            </div>\r\n        </section>\r\n    </div>\r\n</div>\r\n\r\n\r\n';});


define('text!views/users/edit.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>EDIT USER</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<section data-bind="with: user">\r\n    <div class="row">\r\n        <div class="large-12 columns">\r\n            <fieldset>\r\n                <h4>User information</h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-5 columns end">\r\n                        <span data-bind="text: \'Pid: \' + pid()"></span>\r\n                    </div>\r\n                </div>\r\n            </fieldset>\r\n\r\n            <fieldset>\r\n                <h4>Departmental roles</h4>\r\n\r\n                <div class="row">\r\n                    <div class="large-6 medium-8 columns end">\r\n                        <label>\r\n                            Department\r\n                        </label>\r\n                        <select data-bind="foreach: $parent.units, value: $parent.selectedDepartmentId">\r\n                            <optgroup data-bind="attr: { label: name }, foreach: departments">\r\n                                <option data-bind="attr: { label: name, value: id }, text: name"></option>\r\n                            </optgroup>\r\n                        </select>\r\n                    </div>\r\n                </div>\r\n\r\n                <!-- ko foreach: $parent.assignmentVMRows -->\r\n                <div class="row" data-bind="foreach: $data">\r\n                    <div class="large-3 columns end">\r\n                        <label>\r\n                            <input type="checkbox" data-bind="checkedValue: role, checked: isSelected" />\r\n                            <span data-bind="text: role.name"></span>\r\n                        </label>\r\n                    </div>\r\n                </div>\r\n                <!--/ko-->\r\n            </fieldset>\r\n\r\n            <div class="row">\r\n                <div class="large-12 columns">\r\n                    <span class="save-button" data-bind="click: $parent.saveChanges">Save</span>\r\n                    <span class="cancel-button" data-bind="click: $parent.cancelChanges">Cancel</span>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</section>\r\n';});


define('text!views/users/index.html',[],function () { return '<div class="row">\r\n    <div class="large-12 columns">\r\n        <h2 class="background"><span>USERS</span></h2>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-12 columns">\r\n        <p>\r\n            <a href="/users/create">Create</a>\r\n        </p>\r\n    </div>\r\n</div>\r\n\r\n<div class="row">\r\n    <div class="large-6 medium-8 columns end">\r\n        <label for="Unit">\r\n            Department\r\n        </label>\r\n        <select data-bind="value: selectedDepartmentId">\r\n            <!-- ko foreach: units -->\r\n            <optgroup data-bind="attr: { label: name }, foreach: departments">\r\n                <option data-bind="attr: { label: name, value: id }, text: name"></option>\r\n            </optgroup>\r\n            <!--/ko-->\r\n        </select>\r\n    </div>\r\n</div>\r\n\r\n<div class="row" data-bind="if: users().length > 0">\r\n    <div class="large-12 columns table-container">\r\n        <table>\r\n            <thead>\r\n                <tr>\r\n                    <th>\r\n                        PID\r\n                    </th>\r\n                    <th>\r\n                        Created\r\n                    </th>\r\n                    <th>\r\n                        Creator\r\n                    </th>\r\n                </tr>\r\n            </thead>\r\n            <tbody data-bind="foreach: users">\r\n                <tr>\r\n                    <td>\r\n                        <a data-bind="attr: { href: \'users/edit/\' + id + \'?departmentid=\' + $parent.selectedDepartmentId() }, text: pid"></a>\r\n                    </td>\r\n                    <td data-bind="text: formattedCreatedDate"></td>\r\n                    <td data-bind="text: createdBy"></td>\r\n                </tr>\r\n            </tbody>\r\n        </table>\r\n    </div>\r\n</div>';});

define('plugins/dialog',["durandal/system","durandal/app","durandal/composition","durandal/activator","durandal/viewEngine","jquery","knockout"],function(e,t,n,r,a,i,o){function s(t){return e.defer(function(n){e.isString(t)?e.acquire(t).then(function(t){n.resolve(e.resolveObject(t))}).fail(function(n){e.error("Failed to load dialog module ("+t+"). Details: "+n.message)}):n.resolve(t)}).promise()}var l,d={},c=o.observable(0),u=function(e,t,n,r,a){this.message=e,this.title=t||u.defaultTitle,this.options=n||u.defaultOptions,this.autoclose=r||!1,this.settings=i.extend({},u.defaultSettings,a)};return u.prototype.selectOption=function(e){l.close(this,e)},u.prototype.getView=function(){return a.processMarkup(u.defaultViewMarkup)},u.setViewUrl=function(e){delete u.prototype.getView,u.prototype.viewUrl=e},u.defaultTitle=t.title||"Application",u.defaultOptions=["Ok"],u.defaultSettings={buttonClass:"btn btn-default",primaryButtonClass:"btn-primary autofocus",secondaryButtonClass:"","class":"modal-content messageBox",style:null},u.setDefaults=function(e){i.extend(u.defaultSettings,e)},u.prototype.getButtonClass=function(e){var t="";return this.settings&&(this.settings.buttonClass&&(t=this.settings.buttonClass),0===e()&&this.settings.primaryButtonClass&&(t.length>0&&(t+=" "),t+=this.settings.primaryButtonClass),e()>0&&this.settings.secondaryButtonClass&&(t.length>0&&(t+=" "),t+=this.settings.secondaryButtonClass)),t},u.prototype.getClass=function(){return this.settings?this.settings["class"]:"messageBox"},u.prototype.getStyle=function(){return this.settings?this.settings.style:null},u.prototype.getButtonText=function(t){var n=i.type(t);return"string"===n?t:"object"===n?"string"===i.type(t.text)?t.text:(e.error("The object for a MessageBox button does not have a text property that is a string."),null):(e.error("Object for a MessageBox button is not a string or object but "+n+"."),null)},u.prototype.getButtonValue=function(t){var n=i.type(t);return"string"===n?t:"object"===n?"undefined"===i.type(t.text)?(e.error("The object for a MessageBox button does not have a value property defined."),null):t.value:(e.error("Object for a MessageBox button is not a string or object but "+n+"."),null)},u.defaultViewMarkup=['<div data-view="plugins/messageBox" data-bind="css: getClass(), style: getStyle()">','<div class="modal-header">','<h3 data-bind="html: title"></h3>',"</div>",'<div class="modal-body">','<p class="message" data-bind="html: message"></p>',"</div>",'<div class="modal-footer">',"<!-- ko foreach: options -->",'<button data-bind="click: function () { $parent.selectOption($parent.getButtonValue($data)); }, text: $parent.getButtonText($data), css: $parent.getButtonClass($index)"></button>',"<!-- /ko -->",'<div style="clear:both;"></div>',"</div>","</div>"].join("\n"),l={MessageBox:u,currentZIndex:1050,getNextZIndex:function(){return++this.currentZIndex},isOpen:o.computed(function(){return c()>0}),getContext:function(e){return d[e||"default"]},addContext:function(e,t){t.name=e,d[e]=t;var n="show"+e.substr(0,1).toUpperCase()+e.substr(1);this[n]=function(t,n){return this.show(t,n,e)}},createCompositionSettings:function(e,t){var n={model:e,activate:!1,transition:!1};return t.binding&&(n.binding=t.binding),t.attached&&(n.attached=t.attached),t.compositionComplete&&(n.compositionComplete=t.compositionComplete),n},getDialog:function(e){return e?e.__dialog__:void 0},close:function(e){var t=this.getDialog(e);if(t){var n=Array.prototype.slice.call(arguments,1);t.close.apply(t,n)}},show:function(t,a,i){var o=this,l=d[i||"default"];return e.defer(function(e){s(t).then(function(t){var i=r.create();i.activateItem(t,a).then(function(r){if(r){var a=t.__dialog__={owner:t,context:l,activator:i,close:function(){var n=arguments;i.deactivateItem(t,!0).then(function(r){r&&(c(c()-1),l.removeHost(a),delete t.__dialog__,0===n.length?e.resolve():1===n.length?e.resolve(n[0]):e.resolve.apply(e,n))})}};a.settings=o.createCompositionSettings(t,l),l.addHost(a),c(c()+1),n.compose(a.host,a.settings)}else e.resolve(!1)})})}).promise()},showMessage:function(t,n,r,a,i){return e.isString(this.MessageBox)?l.show(this.MessageBox,[t,n||u.defaultTitle,r||u.defaultOptions,a||!1,i||{}]):l.show(new this.MessageBox(t,n,r,a,i))},install:function(e){t.showDialog=function(e,t,n){return l.show(e,t,n)},t.closeDialog=function(){return l.close.apply(l,arguments)},t.showMessage=function(e,t,n,r,a){return l.showMessage(e,t,n,r,a)},e.messageBox&&(l.MessageBox=e.messageBox),e.messageBoxView&&(l.MessageBox.prototype.getView=function(){return a.processMarkup(e.messageBoxView)}),e.messageBoxViewUrl&&l.MessageBox.setViewUrl(e.messageBoxViewUrl)}},l.addContext("default",{blockoutOpacity:.2,removeDelay:200,addHost:function(e){var t=i("body"),n=i('<div class="modalBlockout"></div>').css({"z-index":l.getNextZIndex(),opacity:this.blockoutOpacity}).appendTo(t),r=i('<div class="modalHost"></div>').css({"z-index":l.getNextZIndex()}).appendTo(t);if(e.host=r.get(0),e.blockout=n.get(0),!l.isOpen()){e.oldBodyMarginRight=t.css("margin-right"),e.oldInlineMarginRight=t.get(0).style.marginRight;var a=i("html"),o=t.outerWidth(!0),s=a.scrollTop();i("html").css("overflow-y","hidden");var d=i("body").outerWidth(!0);t.css("margin-right",d-o+parseInt(e.oldBodyMarginRight,10)+"px"),a.scrollTop(s)}},removeHost:function(e){if(i(e.host).css("opacity",0),i(e.blockout).css("opacity",0),setTimeout(function(){o.removeNode(e.host),o.removeNode(e.blockout)},this.removeDelay),!l.isOpen()){var t=i("html"),n=t.scrollTop();t.css("overflow-y","").scrollTop(n),e.oldInlineMarginRight?i("body").css("margin-right",e.oldBodyMarginRight):i("body").css("margin-right","")}},attached:function(e){i(e).css("visibility","hidden")},compositionComplete:function(e,t,n){var r=l.getDialog(n.model),a=i(e),o=a.find("img").filter(function(){var e=i(this);return!(this.style.width&&this.style.height||e.attr("width")&&e.attr("height"))});a.data("predefinedWidth",a.get(0).style.width);var s=function(e,t){setTimeout(function(){var n=i(e);t.context.reposition(e),i(t.host).css("opacity",1),n.css("visibility","visible"),n.find(".autofocus").first().focus()},1)};s(e,r),o.load(function(){s(e,r)}),(a.hasClass("autoclose")||n.model.autoclose)&&i(r.blockout).click(function(){r.close()})},reposition:function(e){var t=i(e),n=i(window);t.data("predefinedWidth")||t.css({width:""});var r=t.outerWidth(!1),a=t.outerHeight(!1),o=n.height()-10,s=n.width()-10,l=Math.min(a,o),d=Math.min(r,s);t.css({"margin-top":(-l/2).toString()+"px","margin-left":(-d/2).toString()+"px"}),a>o?t.css("overflow-y","auto").outerHeight(o):t.css({"overflow-y":"",height:""}),r>s?t.css("overflow-x","auto").outerWidth(s):(t.css("overflow-x",""),t.data("predefinedWidth")?t.css("width",t.data("predefinedWidth")):t.outerWidth(d))}}),l});
define('plugins/http',["jquery","knockout"],function(e,t){return{callbackParam:"callback",toJSON:function(e){return t.toJSON(e)},get:function(n,r,a){return e.ajax(n,{data:r,headers:t.toJS(a)})},jsonp:function(n,r,a,i){return-1==n.indexOf("=?")&&(a=a||this.callbackParam,n+=-1==n.indexOf("?")?"?":"&",n+=a+"=?"),e.ajax({url:n,dataType:"jsonp",data:r,headers:t.toJS(i)})},put:function(n,r,a){return e.ajax({url:n,data:this.toJSON(r),type:"PUT",contentType:"application/json",dataType:"json",headers:t.toJS(a)})},post:function(n,r,a){return e.ajax({url:n,data:this.toJSON(r),type:"POST",contentType:"application/json",dataType:"json",headers:t.toJS(a)})},remove:function(n,r,a){return e.ajax({url:n,data:r,type:"DELETE",headers:t.toJS(a)})}}});
define('plugins/observable',["durandal/system","durandal/binder","knockout"],function(e,t,n){function r(e){var t=e[0];return"_"===t||"$"===t||x&&e===x}function a(t){return!(!t||void 0===t.nodeType||!e.isNumber(t.nodeType))}function i(e){if(!e||a(e)||e.ko===n||e.jquery)return!1;var t=f.call(e);return-1==v.indexOf(t)&&!(e===!0||e===!1)}function o(e){var t={};return Object.defineProperty(e,"__observable__",{enumerable:!1,configurable:!1,writable:!1,value:t}),t}function s(e,t,n){var r=e.__observable__,a=!0;if(!r||!r.__full__){r=r||o(e),r.__full__=!0,b.forEach(function(n){t[n]=function(){return w[n].apply(e,arguments)}}),h.forEach(function(n){e[n]=function(){a=!1;var e=I[n].apply(t,arguments);return a=!0,e}}),g.forEach(function(n){e[n]=function(){a&&t.valueWillMutate();var r=w[n].apply(e,arguments);return a&&t.valueHasMutated(),r}}),y.forEach(function(r){e[r]=function(){for(var i=0,o=arguments.length;o>i;i++)l(arguments[i],n);a&&t.valueWillMutate();var s=w[r].apply(e,arguments);return a&&t.valueHasMutated(),s}}),e.splice=function(){for(var r=2,i=arguments.length;i>r;r++)l(arguments[r],n);a&&t.valueWillMutate();var o=w.splice.apply(e,arguments);return a&&t.valueHasMutated(),o};for(var i=0,s=e.length;s>i;i++)l(e[i],n)}}function l(t,r){var a,l;if(x&&t&&t[x]&&(r=r?r.slice(0):[],r.push(t[x])),i(t)&&(a=t.__observable__,!a||!a.__full__)){if(a=a||o(t),a.__full__=!0,e.isArray(t)){var d=n.observableArray(t);s(t,d,r)}else for(var p in t)if(!m(p)&&!a[p]){var f=Object.getPropertyDescriptor(t,p);f&&(f.get||f.set)?u(t,p,{get:f.get,set:f.set}):(l=t[p],e.isFunction(l)||c(t,p,l,r))}k&&e.log("Converted",t)}}function d(e,t,n){n?t?t.destroyAll||s(t,e):(t=[],s(t,e)):l(t),e(t)}function c(t,r,a,i){var c,u,p=t.__observable__||o(t);if(void 0===a&&(a=t[r]),e.isArray(a))c=n.observableArray(a),s(a,c,i),u=!0;else if("function"==typeof a){if(!n.isObservable(a))return null;c=a}else!A&&e.isPromise(a)?(c=n.observable(),a.then(function(t){if(e.isArray(t)){var r=n.observableArray(t);s(t,r,i),t=r}c(t)})):(c=n.observable(a),l(a,i));return i&&i.length>0&&i.forEach(function(n){e.isArray(a)?c.subscribe(function(e){n(t,r,null,e)},null,"arrayChange"):c.subscribe(function(e){n(t,r,e,null)})}),Object.defineProperty(t,r,{configurable:!0,enumerable:!0,get:c,set:n.isWriteableObservable(c)?function(t){t&&e.isPromise(t)&&!A?t.then(function(t){d(c,t,e.isArray(t))}):d(c,t,u)}:void 0}),p[r]=c,c}function u(t,r,a){var i,o={owner:t,deferEvaluation:!0};return"function"==typeof a?o.read=a:("value"in a&&e.error('For defineProperty, you must not specify a "value" for the property. You must provide a "get" function.'),"function"!=typeof a.get&&"function"!=typeof a.read&&e.error('For defineProperty, the third parameter must be either an evaluator function, or an options object containing a function called "get".'),o.read=a.get||a.read,o.write=a.set||a.write),i=n.computed(o),t[r]=i,c(t,r,i)}var p,m,f=Object.prototype.toString,v=["[object Function]","[object String]","[object Boolean]","[object Number]","[object Date]","[object RegExp]"],h=["remove","removeAll","destroy","destroyAll","replace"],g=["pop","reverse","sort","shift","slice"],y=["push","unshift"],b=["filter","map","reduce","reduceRight","forEach","every","some"],w=Array.prototype,I=n.observableArray.fn,k=!1,x=void 0,A=!1;if(!("getPropertyDescriptor"in Object)){var T=Object.getOwnPropertyDescriptor,S=Object.getPrototypeOf;Object.getPropertyDescriptor=function(e,t){for(var n,r=e;r&&!(n=T(r,t));)r=S(r);return n}}return p=function(e,t){var r,a,i;return e?(r=e.__observable__,r&&(a=r[t])?a:(i=e[t],n.isObservable(i)?i:c(e,t,i))):null},p.defineProperty=u,p.convertProperty=c,p.convertObject=l,p.install=function(e){var n=t.binding;t.binding=function(e,t,r){r.applyBindings&&!r.skipConversion&&l(e),n(e,t)},k=e.logConversion,e.changeDetection&&(x=e.changeDetection),A=e.skipPromises,m=e.shouldIgnorePropertyName||r},p});
define('plugins/serializer',["durandal/system"],function(e){return{typeAttribute:"type",space:void 0,replacer:function(e,t){if(e){var n=e[0];if("_"===n||"$"===n)return void 0}return t},serialize:function(t,n){return n=void 0===n?{}:n,(e.isString(n)||e.isNumber(n))&&(n={space:n}),JSON.stringify(t,n.replacer||this.replacer,n.space||this.space)},getTypeId:function(e){return e?e[this.typeAttribute]:void 0},typeMap:{},registerType:function(){var t=arguments[0];if(1==arguments.length){var n=t[this.typeAttribute]||e.getModuleId(t);this.typeMap[n]=t}else this.typeMap[t]=arguments[1]},reviver:function(e,t,n,r){var a=n(t);if(a){var i=r(a);if(i)return i.fromJSON?i.fromJSON(t):new i(t)}return t},deserialize:function(e,t){var n=this;t=t||{};var r=t.getTypeId||function(e){return n.getTypeId(e)},a=t.getConstructor||function(e){return n.typeMap[e]},i=t.reviver||function(e,t){return n.reviver(e,t,r,a)};return JSON.parse(e,i)},clone:function(e,t){return this.deserialize(this.serialize(e,t),t)}}});
define('plugins/widget',["durandal/system","durandal/composition","jquery","knockout"],function(e,t,n,r){function a(e,n){var a=r.utils.domData.get(e,l);a||(a={parts:t.cloneNodes(r.virtualElements.childNodes(e))},r.virtualElements.emptyNode(e),r.utils.domData.set(e,l,a)),n.parts=a.parts}var i={},o={},s=["model","view","kind"],l="durandal-widget-data",d={getSettings:function(t){var n=r.utils.unwrapObservable(t())||{};if(e.isString(n))return{kind:n};for(var a in n)n[a]=-1!=r.utils.arrayIndexOf(s,a)?r.utils.unwrapObservable(n[a]):n[a];return n},registerKind:function(e){r.bindingHandlers[e]={init:function(){return{controlsDescendantBindings:!0}},update:function(t,n,r,i,o){var s=d.getSettings(n);s.kind=e,a(t,s),d.create(t,s,o,!0)}},r.virtualElements.allowedBindings[e]=!0,t.composeBindings.push(e+":")},mapKind:function(e,t,n){t&&(o[e]=t),n&&(i[e]=n)},mapKindToModuleId:function(e){return i[e]||d.convertKindToModulePath(e)},convertKindToModulePath:function(e){return"widgets/"+e+"/viewmodel"},mapKindToViewId:function(e){return o[e]||d.convertKindToViewPath(e)},convertKindToViewPath:function(e){return"widgets/"+e+"/view"},createCompositionSettings:function(e,t){return t.model||(t.model=this.mapKindToModuleId(t.kind)),t.view||(t.view=this.mapKindToViewId(t.kind)),t.preserveContext=!0,t.activate=!0,t.activationData=t,t.mode="templated",t},create:function(e,n,r,a){a||(n=d.getSettings(function(){return n},e));var i=d.createCompositionSettings(e,n);t.compose(e,i,r)},install:function(e){if(e.bindingName=e.bindingName||"widget",e.kinds)for(var n=e.kinds,i=0;i<n.length;i++)d.registerKind(n[i]);r.bindingHandlers[e.bindingName]={init:function(){return{controlsDescendantBindings:!0}},update:function(e,t,n,r,i){var o=d.getSettings(t);a(e,o),d.create(e,o,i,!0)}},t.composeBindings.push(e.bindingName+":"),r.virtualElements.allowedBindings[e.bindingName]=!0}};return d});
define('transitions/entrance',["durandal/system","durandal/composition","jquery"],function(e,t,n){function r(e,t){e.classList.remove(t?"entrance-in-fade":"entrance-in"),e.classList.remove("entrance-out")}var a=100,i={left:"0px",opacity:1},o={left:"",top:"",right:"",bottom:"",position:"",opacity:""},s=navigator.userAgent.match(/Trident/)||navigator.userAgent.match(/MSIE/),l=!1,c="Webkit Moz O ms Khtml".split(" "),d=document.createElement("div");if(void 0!==d.style.animationName&&(l=!0),!l)for(var u=0;u<c.length;u++)if(void 0!==d.style[c[u]+"AnimationName"]){l=!0;break}l?s?e.log("Using CSS3/jQuery mixed animations."):e.log("Using CSS3 animations."):e.log("Using jQuery animations.");var p=function(t){return e.defer(function(e){function c(){e.resolve()}function d(){t.keepScrollPosition||n(document).scrollTop(0)}function u(){d(),t.triggerAttach(),l?(r(t.child,f),t.child.classList.add(f?"entrance-in-fade":"entrance-in"),setTimeout(function(){r(t.child,f),t.activeView&&r(t.activeView,f),m.css(o),c()},p)):m.animate(i,{duration:p,easing:"swing",always:function(){m.css(o),c()}})}if(t.child){var p=t.duration||500,m=n(t.child),f=!!t.fadeOnly,v={display:"block",opacity:0,position:"absolute",left:f||l?"0px":"20px",right:0,top:0,bottom:0};m.css(v),t.activeView?l&&!s?(r(t.activeView,f),t.activeView.classList.add("entrance-out"),setTimeout(u,a)):n(t.activeView).fadeOut({duration:a,always:u}):u()}else n(t.activeView).fadeOut(a,c)}).promise()};return p});
define('transitions/scrollers',["durandal/system","durandal/composition","jquery"],function(e,t,n){var r=function(t){return e.defer(function(e){function r(){e.resolve()}function a(){t.keepScrollPosition||n(document).scrollTop(0)}function i(){a(),t.triggerAttach();var e=n(t.child);e.show(0,r)}t.child?t.activeView?n(t.activeView).hide(0,i):i():n(t.activeView).hide(0,r)}).promise()};return r});

require(["main"]);
}());