let defineReactive = function (data, key, value) {
  observer(value);
  let dep = new Dep();
  Object.defineProperty(data, key, {
    get:function () {
      if(Dep.target){
        dep.addSub(Dep.target);
      }
      return value;
    },
    set:function (newVal) {
      if(value != newVal){
        value = newVal;
        dep.notify();
      }
    },
  });
};

let observer = function (data){
  if(!data || typeof data !== 'object'){
    return;
  }
  Object.keys(data).forEach(key=>{
    defineReactive(data, key, data[key])
  });
}

let Dep = function () {
  this.sub = [];
}

Dep.prototype.addSub = function (sub) {
  this.sub.push(sub)
}

Dep.prototype.notify = function () {
  this.sub.forEach(key =>{
    key.updata();
  })
}

Dep.target = null;

let Watcher = function (vm, prop, callback) {
  this.vm = vm;
  this.prop = prop;
  this.callback = callback;
  this.value = this.get();
};

Watcher.prototype.updata = function (){
  let newVal = this.vm.$data[this.prop];
  if(this.value != newVal){
    this.value = newVal;
    this.callback(newVal)
  }
};

Watcher.prototype.get = function (){
  Dep.target = this;
  let value = this.vm.$data[this.prop];
  Dep.target = null;
  return value;
};

let Compile = function (vm) {
  this.vm = vm;
  this.el = vm.$el;
  this.fragment = null;
  this.init();
};

Compile.prototype = {
  init:function () {
    this.fragment = this.nodeFragment(this.el);
    this.compileNode(this.fragment);
    this.el.appendChild(this.fragment);
  },
  nodeFragment:function (el) {
    const fragment = document.createDocumentFragment();
    let child = el.firstChild;
    //将子节点，全部移动文档片段里
    while (child) {
      fragment.appendChild(child);
      child = el.firstChild;
    }
    return fragment;
  },
  compileNode:function (fragment) {
    let childNodes = fragment.childNodes;
    [...childNodes].forEach(node=>{
      if(this.isElement(node)){
        this.compileAttr(node);
      }
      let reg = /\{\{(.*)\}\}/;
      let text = node.textContent;
      if(reg.test(text)){
        let prop = reg.exec(text)[1];
        this.compileText(node, prop);
      }
      if(node.childNodes && node.childNodes.length){
        this.compileNode(node);
      }
    })
  },
  compileAttr: function (node) {
    let attrs = node.attributes;
    let reg = /v\-/;
    [...attrs].forEach(attr=>{
      let name = attr.name;
      if(reg.test(name)){
        let value = attr.value;
        if(name === 'v-model'){
          this.compileModel(node, value);
        }
      }
    });
  },
  compileModel:function (node, prop){
    let val = this.vm.$data[prop];
    this.updataModel(node, val);
    new Watcher(this.vm, prop, (value)=>{
      this.updataModel(node, value);
    });
    node.addEventListener('input',e=>{
      let newVal = e.target.value;
      if(val != newVal){
        this.vm.$data[prop] = newVal;
      }
    });
  },
  compileText:function (node, prop){
    let text = this.vm.$data[prop];
    this.updataText(node, text)
    new Watcher(this.vm, prop, (val)=>{
      this.updataText(node, val)
    });
  },
  updataModel: function (node, value){
    node.value = typeof value == 'undefined'?'':value;
  },
  updataText:function (node, value) {
    node.textContent = typeof value == 'undefined'?'':value;
  },
  isElement:function (node){
    return node.nodeType === 1;
  },
  isText: function (node) {
    return node.nodeType === 3;
  }
};

let selfVue = function (options) {
  this.$data = options.data;
  this.$el = document.querySelector(options.el);
  this.init();
}

selfVue.prototype.init = function () {
  observer(this.$data);
  new Compile(this);
}