logger = Components.utils.import("resource://socialite/utils/log.jsm");

var EXPORTED_SYMBOLS = ["WatchedURLs"];

function WatchedURLs(limit) {
  this.watches = {};
  
  // FIFO queue for removing old watched links
  this.watchedQueue = [];
  this.watchedLimit = limit;
}

WatchedLinks.prototype.watchLink = function(href, linkInfo) {
  if (this.watchedLimit && (this.watchedQueue.length == this.watchedLimit)) {
    // Stop watching the oldest link
    delete this.watches[this.watchedQueue.shift()];
  }

  this.watches[href] = linkInfo;
  this.watchedQueue.push(href);
  
  logger.log("WatchedURLs", "Watching: " + href);
}

WatchedLinks.prototype.isWatched = function(href) {
  return (href in this.watches)
}

WatchedLinks.prototype.getLinkInfo = function(href) {
  if (this.isWatched(href)) {
    return this.watches[href];
  } else {
    return null;
  }
}