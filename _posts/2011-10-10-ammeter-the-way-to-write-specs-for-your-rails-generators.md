---
layout: post
title: "Ammeter: The Way to Write Specs for Your Rails Generators"
---

<img src="http://www.alexrothenberg.com/images/2011-10-10-ammeter-a-new-gem-write-specs-for-your-rails-generators/ammeter.jpeg" class="heading_image">

Generators got a complete makeover with Rails 3 making them much easier to write but they've been very hard to test if you're using RSpec.
That's changed now with the [Ammeter](https://github.com/alexrothenberg/ammeter) [Gem](https://rubygems.org/gems/ammeter)
which lets you write RSpec specs for your generators.

## Who writes generators?

Unless you've writing a gem you probably haven't created a generator, but I bet you're using one someone else created.  If you've ever typed

* "rails g rspec:install" and a *spec* director appeared
* "rails g cucumber:install" and gotten a *features* directory
* "rails g model post title:string body:text" and gotten specs for your model
* "rails g model post title:string body:text" and gotten mongoid models insead active record ones

There are a number of resources for writing generators using [thor](https://github.com/wycats/thor) including the
[generators guide](http://guides.rubyonrails.org/generators.html#creating-your-first-generator) or
[railscast #218](http://asciicasts.com/episodes/218-making-generators-in-rails-3) and I'm not going to go into that here.
If you're using _TestUnit_, like the rails core team, you can use _Generators::TestCase_ which is part of Rails -
[Devise](https://github.com/plataformatec/devise/tree/master/test/generators) has some good examples.
For those of us using RSpec we can now use Ammeter.

## Writing Specs with Ammeter

First you need to tell your gem to use ammeter by 1) adding it to our bundle and 2) making it accessible to our specs.

{% highlight ruby %}
  # <YOUR_GEM_NAME>.gemspec
  s.add_development_dependency 'ammeter'
{% endhighlight %}

{% highlight ruby %}
  # spec_helper.rb
  require 'ammeter/init'
{% endhighlight %}

Then we specify the behavior.  We'll look at an example using Mongoid's
[config generator](https://github.com/mongoid/mongoid/blob/master/lib/rails/generators/mongoid/config/config_generator.rb) and
its spec [config_generator_spec](https://github.com/mongoid/mongoid/blob/master/spec/generators/mongoid/config/config_generator_spec.rb).
The generator's usage is `rails generate mongoid:config [DATABASE_NAME] [options]`.

{% highlight ruby %}
# spec/generators/mongoid/config/config_generator_spec.rb
require 'spec_helper'

# Generators are not automatically loaded by Rails
require 'rails/generators/mongoid/config/config_generator'

class Rails::Application; end
class MyApp::Application < Rails::Application; end

describe Mongoid::Generators::ConfigGenerator do
  # Tell the generator where to put its output (what it thinks of as Rails.root)
  destination File.expand_path("../../../../../../tmp", __FILE__)
  before { prepare_destination }

  describe 'no arguments' do
    before { run_generator  }
    describe 'config/mongoid.yml' do
      subject { file('config/mongoid.yml') }
      it { should exist }
      it { should contain "database: my_app_development" }
    end
  end

  describe 'specifying database name' do
    before { run_generator %w(my_database) }
    describe 'config/mongoid.yml' do
      subject { file('config/mongoid.yml') }
      it { should exist }
      it { should contain "database: my_database_development" }
    end
  end
end
{% endhighlight %}

There's some boilerplate setup you'll need at the top of your spec:

* Since this spec file is in *spec/generators* it automatically uses ammeter
* Generators are not automatically loaded by Rails' *const_missing* so we need to *require* it explicitly
* *destination* tells the generator where to put its output (we add enough "../"s to get us out of the spec directory)
* *before { prepare_destination }* clears the destination so each spec starts fresh (similar to active record rollback)

Now for the behavior:

* *run_generator* runs the generator (optionally letting you pass in arguments)
* *file* gives you access to a generated file
* *it should exist* makes sure the file was generated
* *it should contain* looks inside a generated file for a string or regex

When you're generating migrations it is somewhat tricky because migration file names contain a timestamp.
We need another example and will use acts_as_taggable-on's
[migration generator](https://github.com/mbleigh/acts-as-taggable-on/blob/master/lib/generators/acts_as_taggable_on/migration/migration_generator.rb)
We could write a spec for this as

{% highlight ruby %}
# spec/generators/acts_as_taggable_on/migration/migration_generator_spec.rb
require 'spec_helper'

# Generators are not automatically loaded by Rails
require 'generators/acts_as_taggable_on/migration/migration_generator'

describe ActsAsTaggableOn::MigrationGenerator do
  # Tell the generator where to put its output (what it thinks of as Rails.root)
  destination File.expand_path("../../../../../tmp", __FILE__)

  before do
    prepare_destination
    Rails::Generators.options[:rails][:orm] = :active_record
  end
  describe 'no arguments' do
    before { run_generator  }

    describe 'db/migrate/acts_as_taggable_on_migration.rb' do
      subject { file('db/migrate/acts_as_taggable_on_migration.rb') }
      it { should be_a_migration }
    end
  end
end
{% endhighlight %}

You can see much of the same setup and then the new matcher

* *it { should be_a_migration }* which adds a timestamp to the filename

## Why 'Ammeter'?

An [Ammeter](http://en.wikipedia.org/wiki/Ammeter) is a measuring instrument used to measure the electric current in a circuit.
Generators produce electricity and your specs measure your generators ... cute huh :)

## Feedback Welcome

Try Ammeter for your generators, I hope you find it useful. If it doesn't meet your needs fork away - [Ammeter is on github](https://github.com/alexrothenberg/ammeter).
I welcome any feedback, issues or pull requests.

