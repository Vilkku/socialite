Components.utils.import("resource://socialite/socialite.jsm");
faviconWatch = Components.utils.import("resource://socialite/utils/faviconWatch.jsm");

var observerService = Components.classes["@mozilla.org/observer-service;1"]
                                         .getService(Components.interfaces.nsIObserverService);

var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                       .getService(Components.interfaces.nsIPromptService); 

var SocialiteSitePreferences = {

  load: function SSPrefs_load() {
    this.strings = document.getElementById("socialitePreferencesStrings");
    this.siteListbox = document.getElementById("socialiteSiteListbox"); 
    this.siteListbox.addSite = function(site) {
      var newItem = document.createElement("listitem");
      newItem.value = site.siteID;
      
      var siteCell = document.createElement("listcell");
      newItem.appendChild(siteCell);
      var urlCell = document.createElement("listcell");
      newItem.appendChild(urlCell);
      
      newItem.update = function() {
        siteCell.setAttribute("class", "listcell-iconic");
        siteCell.setAttribute("label", site.siteName);
        
        if (newItem.removeFaviconWatch) { newItem.removeFaviconWatch(); }
        newItem.removeFaviconWatch = faviconWatch.useFaviconAsAttribute(siteCell, "image", site.siteURL);
        
        urlCell.setAttribute("label", site.siteURL);
      };
      newItem.update();
      
      this.appendChild(newItem);
    }
    this.siteListbox.getItemBySiteID = function(siteID) {
      for (var i=0; i<this.childNodes.length; i++) {
        if (this.childNodes[i].value == siteID)
          return this.childNodes[i];
      }
      return null;
    }
    this.siteListbox.removeSite = function(siteID) {
      var item = this.getItemBySiteID(siteID);
      if (item) {
        if (item.removeFaviconWatch) { item.removeFaviconWatch(); }
        this.removeChild(item);
      }
    }
    
    // Populate the list
    for each (var site in Socialite.sites.byID) {
      if (site) {
        this.siteListbox.addSite(site);
      }
    };
    
    observerService.addObserver(this.siteObserver, "socialite-load-site", false);
    observerService.addObserver(this.siteObserver, "socialite-unload-site", false);
  },
  
  unload: function SSPrefs_unload() {
    Array.map(this.siteListbox.childNodes, function(item) {
      if (item.removeFaviconWatch) { item.removeFaviconWatch(); }
    });
    
    observerService.removeObserver(this.siteObserver, "socialite-load-site");
    observerService.removeObserver(this.siteObserver, "socialite-unload-site");
  },
  
  siteObserver: {
    observe: function(subject, topic, data) {
      if (topic == "socialite-load-site") {
        SocialiteSitePreferences.siteListbox.addSite(Socialite.sites.byID[data]);
      } else if (topic == "socialite-unload-site") {
        SocialiteSitePreferences.siteListbox.removeSite(data);
      }
    }
  },

  siteAdd: function SSPrefs_siteAdd(event) {
    var dialog = document.documentElement.openSubDialog("chrome://socialite/content/socialiteSiteProperties.xul", "", {
      isNewSite: true
    });
    
  },
  
  siteProperties: function SSPrefs_siteProperties(event) {
    var item = this.siteListbox.selectedItem;
    if (item) {
      var site = Socialite.sites.byID[item.value];
      var dialog = document.documentElement.openSubDialog("chrome://socialite/content/socialiteSiteProperties.xul", "", {
        isNewSite: false, 
        site: site
      });
      item.update();
    }
  },
  
  siteRemove: function SSPrefs_siteRemove(event) {
    var item = this.siteListbox.selectedItem;
    if (item) {
      var site = Socialite.sites.byID[item.value];
      
      var confirmed = promptService.confirm(window, 
          this.strings.getString("removeSiteConfirm.title"), 
          this.strings.getFormattedString("removeSiteConfirm.message", [ site.siteName ])
      );
      
      if (confirmed) {      
        Socialite.sites.deleteSite(site);
        Socialite.sites.saveConfiguredSites();
      }
    }
  }

};
