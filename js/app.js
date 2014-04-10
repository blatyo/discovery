DiscoverySettings = {
  stackFlow: 1
};

App = Ember.Application.create({
  LOG_TRANSITIONS: true,
  LOG_TRANSITIONS_INTERNAL: true,
  LOG_VIEW_LOOKUPS: true,
  LOG_ACTIVE_GENERATION: true
});

App.Router.map(function() {
  this.resource('stacks', {path: '/*apiNames'});
});

App.ApplicationAdapter = DS.FixtureAdapter;

App.ApplicationRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('stackFlow', DiscoverySettings.stackFlow);
  }
});

App.StacksRoute = Ember.Route.extend({
  model: function(params){
    var stack = this.modelFor('application').get('stack');
    var selections = [];

    params.apiNames.split('/').forEach(function(apiName){
      if(stack){
        var option = stack.get('options').findBy('apiName', apiName);
        if(option){
          selections.addObject(option);
          stack = option.get('stack');
        }
      }
    });

    return selections;
  }
});

App.StacksController = Ember.ArrayController.extend({
  needs: ['application'],

  rootStack: Ember.computed.alias('controllers.application.stack')
});

App.OptionController = Ember.ObjectController.extend({
  needs: ['stacks'],

  selected: function(){
    return this.get('controllers.stacks.model').contains(this.get('model'));
  }.property('controllers.stacks.model', 'model')
});

App.StackFlow = DS.Model.extend({
  stack: DS.belongsTo('stack'),

  apiName: DS.attr()
});

App.Stack = DS.Model.extend({
  options: DS.hasMany('option'),
  parentOption: DS.belongsTo('option'),
  name: DS.attr(),
  apiName: DS.attr(),

  path: function(){
    return this.get('parentOption.path');
  }.property('parentOption.path')
});

App.Option = DS.Model.extend({
  stack: DS.belongsTo('stack'),
  parentStack: DS.belongsTo('stack'),
  name: DS.attr(),
  apiName: DS.attr(),
  imageUrl: DS.attr(),

  path: function(){
    if(this.get('parentStack.path')) return this.get('parentStack.path') + '/' + this.get('apiName');
    return this.get('apiName');
  }.property('apiName', 'parentStack.path')
});

App.StackFlow.FIXTURES = [
  {
    id: 1,
    apiName: 'root',
    stack: 1
  }
];

App.Stack.FIXTURES = [
  {
    id: 1,
    name: 'root',
    apiName: 'root',
    options: [1, 2]
  },
  {
    id: 2,
    name: 'Model',
    apiName: 'model',
    parentOption: 1,
    options: [3, 4]
  },
  {
    id: 3,
    name: 'Model',
    apiName: 'model',
    parentOption: 2,
    options: [5, 6]
  }
];

App.Option.FIXTURES = [
  {
    id: 1,
    name: 'iPhone',
    apiName: 'iphone',
    imageUrl: 'https://cdn.gazelle.com/gz_attachments/product_image/230/949/3/iphone_5s_16.jpg',
    parentStack: 1,
    stack: 2
  },
  {
    id: 2,
    name: 'iPad',
    apiName: 'ipad',
    imageUrl: 'https://cdn.gazelle.com/gz_attachments/product_image/175/808/3/ipad_4_128.jpg',
    parentStack: 1,
    stack: 3
  },
  {
    id: 3,
    name: 'iPhone 5s',
    apiName: 'iphone-5s',
    imageUrl: 'https://cdn.gazelle.com/gz_attachments/product_image/230/949/3/iphone_5s_16.jpg',
    parentStack: 2
  },
  {
    id: 4,
    name: 'iPhone 5c',
    apiName: 'iphone-5c',
    imageUrl: 'https://cdn.gazelle.com/gz_attachments/product_image/230/949/3/iphone_5s_16.jpg',
    parentStack: 2
  },
  {
    id: 5,
    name: 'iPad Mini',
    apiName: 'ipad-mini',
    imageUrl: 'https://cdn.gazelle.com/gz_attachments/product_image/175/808/3/ipad_4_128.jpg',
    parentStack: 3
  },
  {
    id: 6,
    name: 'iPad Air',
    apiName: 'ipad-air',
    imageUrl: 'https://cdn.gazelle.com/gz_attachments/product_image/175/808/3/ipad_4_128.jpg',
    parentStack: 3
  }
];

Ember.Application.initializer({
  name: "force load fixtures",
  after: "store",
  initialize: function(container, application) {
    console.log('fixtures');
    var store = container.lookup('store:main');

    ['stackFlow', 'stack', 'option'].map(function(typeKey){
      var type = App[typeKey.classify()];
      if (type.FIXTURES) {
        store.pushMany(typeKey, type.FIXTURES);
      }
    });
  }
});

