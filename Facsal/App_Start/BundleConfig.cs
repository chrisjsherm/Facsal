using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;

namespace Facsal
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.IgnoreList.Clear();
            AddDefaultIgnorePatterns(bundles.IgnoreList);

            bundles.Add(
                new StyleBundle("~/Content/css")
                  .Include("~/Content/durandal.css")
                  .Include("~/Content/jqueryui/jquery-ui.min.css")
                  .Include("~/Content/jqueryui/jquery-ui.theme.min.css")
                  .Include("~/Content/toastr.css")
                  .Include("~/Content/Site.css")
            );

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr.custom.js"));

            bundles.Add(
                new ScriptBundle("~/Scripts/vendor")
                  .Include("~/Scripts/jquery-{version}.js")
                  .Include("~/Scripts/knockout-{version}.js")
                  .Include("~/Scripts/knockout.validation.js")
                  .Include("~/Scripts/Q.js")
                  .Include("~/Scripts/chrisjsherm/chrisjsherm.counter.js")
                  .Include("~/Scripts/chrisjsherm/chrisjsherm.number.js")
                  .Include("~/Scripts/chrisjsherm/chrisjsherm.string.js")
                  .Include("~/Scripts/chrisjsherm/chrisjsherm.storage.js")
                  .Include("~/Scripts/chrisjsherm/jquery.utilities.js")
                  .Include("~/Scripts/chrisjsherm/chrisjsherm.ko.extenders.js")
                  .Include("~/Scripts/browser.js")
                  .Include("~/Scripts/breeze.debug.js")
                  .Include("~/Scripts/breeze.saveErrorExtensions.js")
                  .Include("~/Scripts/foundation/foundation.js")
                  .Include("~/Scripts/foundation/foundation.reveal.js")
                  .Include("~/Scripts/foundation/foundation.topbar.js")
                  .Include("~/Scripts/foundation/foundation.slider.js")
                  .Include("~/Scripts/jquery-ui.js")
                  .Include("~/Scripts/jquery.ui.touch-punch.js")
                  .Include("~/Scripts/moment.js")
                  .Include("~/Scripts/toastr.js")
            );

            bundles.Add(
                new ScriptBundle("~/Scripts/main-built")
                    .Include("~/App/main-built.js")
            );
        }

        private static void AddDefaultIgnorePatterns(IgnoreList ignoreList)
        {
            if (ignoreList == null)
            {
                throw new ArgumentNullException("BundleConfig ignore list.");
            }

            ignoreList.Ignore("*.intellisense.js");
            ignoreList.Ignore("*-vsdoc.js");
            //ignoreList.Ignore("*.debug.js", OptimizationMode.WhenEnabled);
        }
    }
}