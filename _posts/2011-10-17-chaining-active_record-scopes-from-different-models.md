---
layout: post
title: Chaining ActiveRecord Scopes from Different Models
---

You probably know you can chain ActiveRecord scopes together and it combines it all together into one
sql statement, but did you know that you can also use scopes from associated models in your chain?

Let me show you with an example.
Let's say we have a discussion site where users can post comments with two simple models:

{% highlight ruby %}
class User < ActiveRecord::Base
  has_many :comments
end

class Comment < ActiveRecord::Base
  belongs_to :user
end
{% endhighlight %}

We could display a list of all users with `User.all` or even display them alphabetically with `User.order(:name)`
(yes I'd create a scope if I were doing this for real).

What if I wanted to display the users sorted so that the ones with the most recent comment was first?

{% highlight ruby %}
User.includes(:comments).merge(Comment.order('comments.created_at desc'))
{% endhighlight %}

There's a lot going on there, let's break it down.

* `User.includes(:comments)` - tells active record to query both the *users* and *comments* tables
* `Comment.order('comments.created_at desc')` - sorts the results by the date of the comment
  (we need to specify the table and column name since created_at is also a column on the *users* table)
* `merge(Comment.XXX)` - lets us use a scope from the *Comment* model even though we're dealing with *Users*

When ActiveRecord and ActiveRelation take all this and convert it into a sql statement it will join the *users* and *comments* tables
and order by the comments.created_at column.  Here's the sql I actually get in irb
(boy am I glad I didn't have to type that sql myself!).

{% highlight ruby %}
> User.includes(:comments).merge(Comment.order('comments.created_at desc'))
  SQL (0.4ms)  SELECT "users"."id" AS t0_r0, "users"."name" AS t0_r1, "users"."created_at" AS t0_r2,
                      "users"."updated_at" AS t0_r3, "comments"."id" AS t1_r0, "comments"."user_id" AS t1_r1,
                      "comments"."body" AS t1_r2, "comments"."created_at" AS t1_r3, "comments"."updated_at" AS t1_r4
               FROM "users"
               LEFT OUTER JOIN "comments" ON "comments"."user_id" = "users"."id"
               ORDER BY comments.created_at desc
{% endhighlight %}

## Adding Scopes to make it usable

It works to type all that but in a real application you'd add scopes to make it easier to work with.  Let's do that!

{% highlight ruby %}
class User < ActiveRecord::Base
  has_many :comments
  scope :by_most_recent_comment, includes(:comments).merge(Comment.most_recent_first)
  scope :with_recent_comments, includes(:comments).merge(Comment.recently(1.month.ago))
end

class Comment < ActiveRecord::Base
  belongs_to :user
  scope :most_recent_first, order('comments.created_at desc')
  scope :recently, lambda { |date| where('comments.created_at >= ?', date) }
end
{% endhighlight %}

Now we can write some nice simple scopes like

* `User.by_most_recent_comment` to get all users sorted so the ones with recent comments are at the top
* `User.with_recent_comments` to get all users who have commented in the past month
* `User.with_recent_comments.by_most_recent_comment` to get users who have commented in the past month sorted by the date of their most recent comment.

Happy scoping!