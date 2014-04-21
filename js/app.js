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
  },
  setupController: function(controller, model) {
    controller.set('model', model);
    this.controllerFor('stacks').set('model', []);
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

App.StacksController = Ember.ArrayController.extend({});

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
  product: DS.belongsTo('product'),
  name: DS.attr(),
  apiName: DS.attr(),

  path: function(){
    return this.get('parentOption.path');
  }.property('parentOption.path'),

  isProductStack: function(){
    return !!this.get('product');
  }.property('product')
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

App.Product = DS.Model.extend({
  stack: DS.belongsTo('stack'),

  name: DS.attr(),
  apiName: DS.attr(),
  imageUrl: DS.attr(),
  price: DS.attr('number'),
  expirationDate: DS.attr('date')
});

App.StackFlow.FIXTURES = [
  {
    id: 1,
    apiName: 'root',
    stack: 1
  }
];

App.Stack.FIXTURES = [];
App.Option.FIXTURES = [];
App.Product.FIXTURES = [];
(function(stacks, options, products){
  var data = {
    iphone: {
      name: 'iPhone',
      imageUrl: 'https://cdn.gazelle.com/gz_attachments/product_image/230/949/3/iphone_5s_16.jpg',
      stacks: [
        ['Model', ['iPhone 5S', 'iPhone 5C', 'iPhone 5', 'iPhone 4S', 'iPhone 4']],
        ['Carrier', ['AT&T', 'Sprint', 'T-Mobile', 'Verizon', 'Other Carrier', 'Unlocked']],
        ['Capacity', ['16GB', '32GB', '64GB']],
        ['Condition', ['Broken', 'Good', 'Perfect']]
      ]
    },
    ipad: {
      name: 'iPad',
      imageUrl: 'https://cdn.gazelle.com/gz_attachments/product_image/175/808/3/ipad_4_128.jpg',
      stacks: [
        ['Model', ['iPad Mini', 'iPad Air', 'iPad']],
        ['Generation', ['3rd Gen', '2nd Gen', '1st Gen']],
        ['Carrier', ['AT&T', 'Sprint', 'T-Mobile', 'Verizon', 'Wifi']],
        ['Capacity', ['16GB', '32GB', '64GB']],
        ['Condition', ['Broken', 'Good', 'Perfect']]
      ]
    },
    'cell-phone': {
      name: 'Cell Phone',
      imageUrl: 'https://cdn.gazelle.com/gz_attachments/product_image/130/636/6/samsung-galaxy-s3.jpg',
      stacks: [
        ['Manufacturer', ['BlackBerry', 'HTC', 'LG', 'Motorola', 'Nokia', 'Samsung']],
        ['Carrier', ['AT&T', 'Sprint', 'T-Mobile', 'Verizon', 'Unlocked']],
        ['Condition', ['Broken', 'Good', 'Perfect']]
      ]
    }
  };

  var apierize = function(name){
    return name.replace('iP', 'ip').dasherize();
  };

  var buildProduct = function(ancestors, imageUrl){
    var product = {
      id: products.length + 1,
      name: ancestors.join(' '),
      apiName: apierize(ancestors.join(' ')),
      imageUrl: imageUrl,
      price: Math.floor(Math.random() * 1000),
      expirationDate: new Date()
    };
    products.push(product);

    return product;
  };

  var buildOption = function(ancestors, imageUrl, remainingStacks, name){
    var option = {
      id: options.length + 1,
      name: name,
      apiName: apierize(name),
      imageUrl: imageUrl
    };
    options.push(option);

    ancestors = ancestors.slice(0);
    ancestors.push(option.name);
    var stack = buildStack(ancestors, imageUrl, remainingStacks);
    option.stack = stack.id;
    stack.parentOption = option.id;

    return option;
  };

  var buildStack = function(ancestors, imageUrl, remainingStacks){
    remainingStacks = remainingStacks.slice(0);
    var stackData = remainingStacks.shift();
    var stack = {
      id: stacks.length + 1
    };
    stacks.push(stack);

    if(stackData){
      stack.name = stackData[0];
      stack.apiName = apierize(stackData[0]);
      stack.options = stackData[1].map(function(optionName){
        var option = buildOption(ancestors, imageUrl, remainingStacks, optionName);
        option.parentStack = stack.id;
        return option.id;
      });
    } else {
      var product = buildProduct(ancestors, imageUrl);
      stack.product = product.id;
      stack.name = 'Product';
      stack.apiName = 'product';
    }
    return stack;
  };

  var topStack = {
    id: stacks.length + 1,
    name: 'Root',
    apiName: 'root',
    options: []
  };
  stacks.push(topStack);
  var categoryData, categoryOption, categoryStack;
  for(var category in data){
    categoryData = data[category];
    categoryOption = {
      id: options.length + 1,
      name: categoryData.name,
      apiName: apierize(categoryData.name),
      imageUrl: categoryData.imageUrl
    };
    options.push(categoryOption);

    categoryStack = buildStack([], categoryData.imageUrl, categoryData.stacks);
    topStack.options.push(categoryOption.id);
    categoryOption.stack = categoryStack.id;
    categoryStack.parentOption = categoryOption.id;
    categoryOption.parentStack = topStack.id;
  }
})(App.Stack.FIXTURES, App.Option.FIXTURES, App.Product.FIXTURES);

Ember.Application.initializer({
  name: "force load fixtures",
  after: "store",
  initialize: function(container, application) {
    console.log('fixtures');
    var store = container.lookup('store:main');

    ['stackFlow', 'stack', 'option', 'product'].map(function(typeKey){
      var type = App[typeKey.classify()];
      if (type.FIXTURES) {
        store.pushMany(typeKey, type.FIXTURES);
      }
    });
  }
});

