/* -*- Mode: javascript; tab-width: 2; indent-tabs-mode: nil; js-indent-level: 2 -*- */

requestLongerTimeout(2);

var {Promise: promise} = Cu.import("resource://gre/modules/Promise.jsm", {});
Cu.import("resource://gre/modules/Services.jsm");

const gHttpTestRoot = "http://example.com/browser/dom/base/test/";

add_task(function* test_initialize() {
});

add_task(function* () {
  // Check that use counters are incremented by SVGs loaded directly in iframes.
  yield check_use_counter_iframe("file_use_counter_svg_getElementById.svg",
                                 "SVGSVGELEMENT_GETELEMENTBYID");
  yield check_use_counter_iframe("file_use_counter_svg_currentScale.svg",
                                 "SVGSVGELEMENT_CURRENTSCALE_getter");
  yield check_use_counter_iframe("file_use_counter_svg_currentScale.svg",
                                 "SVGSVGELEMENT_CURRENTSCALE_setter");

  // Check that even loads from the imglib cache update use counters.  The
  // images should still be there, because we just loaded them in the last
  // set of tests.  But we won't get updated counts for the document
  // counters, because we won't be re-parsing the SVG documents.
  yield check_use_counter_iframe("file_use_counter_svg_getElementById.svg",
                                 "SVGSVGELEMENT_GETELEMENTBYID", false);
  yield check_use_counter_iframe("file_use_counter_svg_currentScale.svg",
                                 "SVGSVGELEMENT_CURRENTSCALE_getter", false);
  yield check_use_counter_iframe("file_use_counter_svg_currentScale.svg",
                                 "SVGSVGELEMENT_CURRENTSCALE_setter", false);

  // Check that use counters are incremented by SVGs loaded as images.
  // Note that SVG images are not permitted to execute script, so we can only
  // check for properties here.
  yield check_use_counter_img("file_use_counter_svg_getElementById.svg",
                              "PROPERTY_FILL");
  yield check_use_counter_img("file_use_counter_svg_currentScale.svg",
                              "PROPERTY_FILL");

  // Check that use counters are incremented by directly loading SVGs
  // that reference patterns defined in another SVG file.
  yield check_use_counter_direct("file_use_counter_svg_fill_pattern.svg",
                                 "PROPERTY_FILLOPACITY", /*xfail=*/true);

  // Check that use counters are incremented by directly loading SVGs
  // that reference patterns defined in the same file or in data: URLs.
  yield check_use_counter_direct("file_use_counter_svg_fill_pattern_internal.svg",
                                 "PROPERTY_FILLOPACITY");
  // data: URLs don't correctly propagate to their referring document yet.
  //yield check_use_counter_direct("file_use_counter_svg_fill_pattern_data.svg",
  //                               "PROPERTY_FILL_OPACITY");
});

add_task(function* () {
});


function waitForDestroyedDocuments() {
  let deferred = promise.defer();
  SpecialPowers.exactGC(deferred.resolve);
  return deferred.promise;
}

function waitForPageLoad(browser) {
  return ContentTask.spawn(browser, null, function*() {
    Cu.import("resource://gre/modules/PromiseUtils.jsm");
    yield new Promise(resolve => {
      let listener = () => {
        removeEventListener("load", listener, true);
        resolve();
      }
      addEventListener("load", listener, true);
    });
  });
}

var check_use_counter_iframe = Task.async(function* (file, use_counter_middlefix, check_documents=true) {
  info("checking " + file);

  let newTab = gBrowser.addTab( "about:blank");
  gBrowser.selectedTab = newTab;
  newTab.linkedBrowser.stop();

  gBrowser.selectedBrowser.loadURI(gHttpTestRoot + "file_use_counter_outer.html");
  yield waitForPageLoad(gBrowser.selectedBrowser);

  // Inject our desired file into the iframe of the newly-loaded page.
  yield ContentTask.spawn(gBrowser.selectedBrowser, { file: file }, function(opts) {
    Cu.import("resource://gre/modules/PromiseUtils.jsm");
    let deferred = PromiseUtils.defer();

    let wu = content.window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);

    let iframe = content.document.getElementById('content');
    iframe.src = opts.file;
    let listener = (event) => {
      event.target.removeEventListener("load", listener, true);

      deferred.resolve();
    };
    iframe.addEventListener("load", listener, true);

    return deferred.promise;
  });
  
  // Tear down the page.
  gBrowser.removeTab(newTab);

  yield waitForDestroyedDocuments();
});

var check_use_counter_img = Task.async(function* (file, use_counter_middlefix) {
  info("checking " + file);

  let newTab = gBrowser.addTab("about:blank");
  gBrowser.selectedTab = newTab;
  newTab.linkedBrowser.stop();

  gBrowser.selectedBrowser.loadURI(gHttpTestRoot + "file_use_counter_outer.html");
  yield waitForPageLoad(gBrowser.selectedBrowser);

  // Inject our desired file into the img of the newly-loaded page.
  yield ContentTask.spawn(gBrowser.selectedBrowser, { file: file }, function(opts) {
    Cu.import("resource://gre/modules/PromiseUtils.jsm");
    let deferred = PromiseUtils.defer();

    let img = content.document.getElementById('display');
    img.src = opts.file;
    let listener = (event) => {
      img.removeEventListener("load", listener, true);

      deferred.resolve();
    };
    img.addEventListener("load", listener, true);

    return deferred.promise;
  });
  
  // Tear down the page.
  gBrowser.removeTab(newTab);

  yield waitForDestroyedDocuments();
});

var check_use_counter_direct = Task.async(function* (file, use_counter_middlefix, xfail=false) {
  info("checking " + file);

  let newTab = gBrowser.addTab( "about:blank");
  gBrowser.selectedTab = newTab;
  newTab.linkedBrowser.stop();

  gBrowser.selectedBrowser.loadURI(gHttpTestRoot + file);
  yield ContentTask.spawn(gBrowser.selectedBrowser, null, function*() {
    Cu.import("resource://gre/modules/PromiseUtils.jsm");
    yield new Promise(resolve => {
      let listener = () => {
        removeEventListener("load", listener, true);

        setTimeout(resolve, 0);
      }
      addEventListener("load", listener, true);
    });
  });
  
  // Tear down the page.
  gBrowser.removeTab(newTab);

  yield waitForDestroyedDocuments();
});
