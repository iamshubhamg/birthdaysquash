(function (root, factory){
if(typeof define==='function'&&define.amd){
define(['video.js'], function(videojs){
return (root.Vimeo=factory(videojs));
});
}else if(typeof module==='object'&&module.exports){
module.exports=(root.Vimeo=factory(require('video.js')));
}else{
root.Vimeo=factory(root.videojs);
}}(this, function(videojs){
'use strict';
var VimeoState={
UNSTARTED: -1,
ENDED: 0,
PLAYING: 1,
PAUSED: 2,
BUFFERING: 3
};
var Tech=videojs.getComponent('Tech');
var Vimeo=videojs.extend(Tech, {
constructor: function(options, ready){
Tech.call(this, options, ready);
if(options.poster!=""){this.setPoster(options.poster);}
this.setSrc(this.options_.source.src, true);
setTimeout(function(){
this.el_.parentNode.className +=' vjs-vimeo';
}.bind(this));
},
dispose: function(){
this.el_.parentNode.className=this.el_.parentNode.className.replace(' vjs-vimeo', '');
},
createEl: function(){
this.vimeo={};
this.vimeoInfo={};
this.baseUrl='https://player.vimeo.com/video/';
this.baseApiUrl='http://www.vimeo.com/api/v2/video/';
this.videoId=Vimeo.parseUrl(this.options_.source.src).videoId;
this.iframe=document.createElement('iframe');
this.iframe.setAttribute('id', this.options_.techId);
this.iframe.setAttribute('title', 'Vimeo Video Player');
this.iframe.setAttribute('class', 'vimeoplayer');
this.iframe.setAttribute('src', this.baseUrl + this.videoId + '?api=1&player_id=' + this.options_.techId);
this.iframe.setAttribute('frameborder', '0');
this.iframe.setAttribute('scrolling', 'no');
this.iframe.setAttribute('marginWidth', '0');
this.iframe.setAttribute('marginHeight', '0');
this.iframe.setAttribute('webkitAllowFullScreen', '0');
this.iframe.setAttribute('mozallowfullscreen', '0');
this.iframe.setAttribute('allowFullScreen', '0');
var divWrapper=document.createElement('div');
divWrapper.setAttribute('style', 'margin:0 auto;padding-bottom:56.25%;width:100%;height:0;position:relative;overflow:hidden;');
divWrapper.setAttribute('class', 'vimeoFrame');
divWrapper.appendChild(this.iframe);
if(!_isOnMobile&&!this.options_.ytControls){
var divBlocker=document.createElement('div');
divBlocker.setAttribute('class', 'vjs-iframe-blocker');
divBlocker.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%');
divBlocker.onclick=function(){
this.onPause();
}.bind(this);
divWrapper.appendChild(divBlocker);
}
if(Vimeo.isApiReady){
this.initPlayer();
}else{
Vimeo.apiReadyQueue.push(this);
}
/*if(this.options_.poster==""){
console.log(this.baseApiUrl + this.videoId + '.json?callback=?');
$.getJSON(this.baseApiUrl + this.videoId + '.json?callback=?', {format: "json"}, (function(_this){
return function(data){
_this.setPoster(data[0].thumbnail_large);
};})(this));
}*/
return divWrapper;
},
initPlayer: function(){
var self=this;
var vimeoVideoID=Vimeo.parseUrl(this.options_.source.src).videoId;
if(this.vimeo&&this.vimeo.api){
this.vimeo.api('unload');
delete this.vimeo;
}
self.vimeo=$f(self.iframe);
self.vimeoInfo={
state: VimeoState.UNSTARTED,
volume: 1,
muted: false,
muteVolume: 1,
time: 0,
duration: 0,
buffered: 0,
url: self.baseUrl + self.videoId,
error: null
};
this.vimeo.addEvent('ready', function(id){
self.onReady();
self.vimeo.addEvent('loadProgress', function(data, id){ self.onLoadProgress(data); });
self.vimeo.addEvent('playProgress', function(data, id){ self.onPlayProgress(data); });
self.vimeo.addEvent('play', function(id){ self.onPlay(); });
self.vimeo.addEvent('pause', function(id){ self.onPause(); });
self.vimeo.addEvent('finish', function(id){ self.onFinish(); });
self.vimeo.addEvent('seek', function(data, id){ self.onSeek(data); });
});
},
onReady: function(){
this.isReady_=true;
this.triggerReady();
this.trigger('loadedmetadata');
if(this.startMuted){
this.setMuted(true);
this.startMuted=false;
}},
onLoadProgress: function(data){
var durationUpdate = !this.vimeoInfo.duration;
this.vimeoInfo.duration=data.duration;
this.vimeoInfo.buffered=data.percent;
this.trigger('progress');
if(durationUpdate) this.trigger('durationchange');
},
onPlayProgress: function(data){
this.vimeoInfo.time=data.seconds;
this.trigger('timeupdate');
},
onPlay: function(){
this.vimeoInfo.state=VimeoState.PLAYING;
this.trigger('play');
},
onPause: function(){
this.vimeoInfo.state=VimeoState.PAUSED;
this.trigger('pause');
},
onFinish: function(){
this.vimeoInfo.state=VimeoState.ENDED;
this.trigger('ended');
},
onSeek: function(data){
this.trigger('seeking');
this.vimeoInfo.time=data.seconds;
this.trigger('timeupdate');
this.trigger('seeked');
},
onError: function(error){
this.error=error;
this.trigger('error');
},
error: function(){
switch (this.errorNumber){
case 2:
return { code: 'Unable to find the video' };
case 5:
return { code: 'Error while trying to play the video' };
case 100:
return { code: 'Unable to find the video' };
case 101:
case 150:
return { code: 'Playback on other Websites has been disabled by the video owner.' };}
return { code: 'Vimeo unknown error (' + this.errorNumber + ')' };},
src: function(){
return this.source;
},
poster: function(){
return this.poster_;
},
setPoster: function(poster){
this.poster_=poster;
},
setSrc: function(source){
if(!source||!source.src){
return;
}
this.source=source;
this.url=Vimeo.parseUrl(source.src);
if(!this.options_.poster){
if(this.url.videoId){
$.getJSON(this.baseApiUrl + this.videoId + '.json?callback=?', {format: "json"}, (function(_this){
return function(data){
_this.poster_=data[0].thumbnail_small;
};})(this));
this.checkHighResPoster();
}}
if(this.options_.autoplay&&!_isOnMobile){
if(this.isReady_){
this.play();
}else{
this.playOnReady=true;
}}
},
supportsFullScreen: function(){
return true;
},
load:function(){},
play:function(){ this.vimeo.api('play'); },
pause:function(){ this.vimeo.api('pause'); },
paused:function(){
return this.vimeoInfo.state!==VimeoState.PLAYING &&
this.vimeoInfo.state!==VimeoState.BUFFERING;
},
currentTime:function(){ return this.vimeoInfo.time||0; },
setCurrentTime :function(seconds){
this.vimeo.api('seekTo', seconds);
this.player_.trigger('timeupdate');
},
duration :function(){ return this.vimeoInfo.duration||0; },
buffered :function(){ return videojs.createTimeRange(0, (this.vimeoInfo.buffered*this.vimeoInfo.duration)||0); },
volume :function(){ return (this.vimeoInfo.muted)? this.vimeoInfo.muteVolume:this.vimeoInfo.volume; },
setVolume :function(percentAsDecimal){
this.vimeo.api('setvolume', percentAsDecimal);
this.vimeoInfo.volume=percentAsDecimal;
this.player_.trigger('volumechange');
},
currentSrc :function(){
return this.el_.src;
},
muted :function(){ return this.vimeoInfo.muted||false; },
setMuted :function(muted){
if(muted){
this.vimeoInfo.muteVolume=this.vimeoInfo.volume;
this.setVolume(0);
}else{
this.setVolume(this.vimeoInfo.muteVolume);
}
this.vimeoInfo.muted=muted;
this.player_.trigger('volumechange');
},
checkHighResPoster: function(){
var uri='';
try {
$.getJSON(this.baseApiUrl + this.videoId + '.json?callback=?', {format: "json"}, (function(_uri){
return function(data){
_uri=data[0].thumbnail_large;
};})(uri));
var image=new Image();
image.onload=function(){
if('naturalHeight' in this){
if(this.naturalHeight <=90||this.naturalWidth <=120){
this.onerror();
return;
}}else if(this.height <=90||this.width <=120){
this.onerror();
return;
}
this.poster_=uri;
this.trigger('posterchange');
}.bind(this);
image.onerror=function(){};
image.src=uri;
}
catch(e){}}
});
Vimeo.isSupported=function(){
return true;
};
Vimeo.canPlaySource=function(e){
return (e.type==='video/vimeo');
};
var _isOnMobile=/(iPad|iPhone|iPod|Android)/g.test(navigator.userAgent);
Vimeo.parseUrl=function(url){
var result={
videoId: null
};
var regex=/^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
var match=url.match(regex);
if(match){
result.videoId=match[5];
}
return result;
};
function injectCss(){
var css =
'.vjs-vimeo .vjs-iframe-blocker { display: none; }' +
'.vjs-vimeo.vjs-user-inactive .vjs-iframe-blocker { display: block; }' +
'.vjs-vimeo .vjs-poster { background-size: cover; }' +
'.vjs-vimeo { height:100%; }' +
'.vimeoplayer { width:100%; height:180%; position:absolute; left:0; top:-40%; }';
var head=document.head||document.getElementsByTagName('head')[0];
var style=document.createElement('style');
style.type='text/css';
if(style.styleSheet){
style.styleSheet.cssText=css;
}else{
style.appendChild(document.createTextNode(css));
}
head.appendChild(style);
}
Vimeo.apiReadyQueue=[];
var vimeoIframeAPIReady=function(){
Vimeo.isApiReady=true;
injectCss();
for (var i=0; i < Vimeo.apiReadyQueue.length; ++i){
Vimeo.apiReadyQueue[i].initPlayer();
}};
vimeoIframeAPIReady();
videojs.registerTech('Vimeo', Vimeo);
var Froogaloop=(function(){
function Froogaloop(iframe){
return new Froogaloop.fn.init(iframe);
}
var eventCallbacks={},
hasWindowEvent=false,
isReady=false,
slice=Array.prototype.slice,
playerOrigin='*';
Froogaloop.fn=Froogaloop.prototype={
element: null,
init: function(iframe){
if(typeof iframe==="string"){
iframe=document.getElementById(iframe);
}
this.element=iframe;
return this;
},
api: function(method, valueOrCallback){
if(!this.element||!method){
return false;
}
var self=this,
element=self.element,
target_id=element.id!=='' ? element.id:null,
params = !isFunction(valueOrCallback) ? valueOrCallback:null,
callback=isFunction(valueOrCallback) ? valueOrCallback:null;
if(callback){
storeCallback(method, callback, target_id);
}
postMessage(method, params, element);
return self;
},
addEvent: function(eventName, callback){
if(!this.element){
return false;
}
var self=this,
element=self.element,
target_id=element.id!=='' ? element.id:null;
storeCallback(eventName, callback, target_id);
if(eventName!='ready'){
postMessage('addEventListener', eventName, element);
}
else if(eventName=='ready'&&isReady){
callback.call(null, target_id);
}
return self;
},
removeEvent: function(eventName){
if(!this.element){
return false;
}
var self=this,
element=self.element,
target_id=element.id!=='' ? element.id:null,
removed=removeCallback(eventName, target_id);
if(eventName!='ready'&&removed){
postMessage('removeEventListener', eventName, element);
}}
};
function postMessage(method, params, target){
if(!target.contentWindow.postMessage){
return false;
}
var data=JSON.stringify({
method: method,
value: params
});
target.contentWindow.postMessage(data, playerOrigin);
}
function onMessageReceived(event){
var data, method;
try {
data=JSON.parse(event.data);
method=data.event||data.method;
}
catch(e){
}
if(method=='ready'&&!isReady){
isReady=true;
}
if(!(/^https?:\/\/player.vimeo.com/).test(event.origin)){
return false;
}
if(playerOrigin==='*'){
playerOrigin=event.origin;
}
var value=data.value,
eventData=data.data,
target_id=target_id==='' ? null:data.player_id,
callback=getCallback(method, target_id),
params=[];
if(!callback){
return false;
}
if(value!==undefined){
params.push(value);
}
if(eventData){
params.push(eventData);
}
if(target_id){
params.push(target_id);
}
return params.length > 0 ? callback.apply(null, params):callback.call();
}
function storeCallback(eventName, callback, target_id){
if(target_id){
if(!eventCallbacks[target_id]){
eventCallbacks[target_id]={};}
eventCallbacks[target_id][eventName]=callback;
}else{
eventCallbacks[eventName]=callback;
}}
function getCallback(eventName, target_id){
if(target_id&&eventCallbacks[target_id]){
return eventCallbacks[target_id][eventName];
}
else if(eventCallbacks[eventName]){
return eventCallbacks[eventName];
}}
function removeCallback(eventName, target_id){
if(target_id&&eventCallbacks[target_id]){
if(!eventCallbacks[target_id][eventName]){
return false;
}
eventCallbacks[target_id][eventName]=null;
}else{
if(!eventCallbacks[eventName]){
return false;
}
eventCallbacks[eventName]=null;
}
return true;
}
function isFunction(obj){
return !!(obj&&obj.constructor&&obj.call&&obj.apply);
}
function isArray(obj){
return toString.call(obj)==='[object Array]';
}
Froogaloop.fn.init.prototype=Froogaloop.fn;
if(window.addEventListener){
window.addEventListener('message', onMessageReceived, false);
}else{
window.attachEvent('onmessage', onMessageReceived);
}
return (window.Froogaloop=window.$f=Froogaloop);
})();
}));