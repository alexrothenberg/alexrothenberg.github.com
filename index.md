---
title: Alex Rothenberg
layout: master
---

<div class="posts">
  {% for post in site.posts %}
    <div class="post_summary">
      <span class="post_date">{{ post.date | date_to_string }}</span>
      <a class="post_title" href="{{ post.url }}">{{ post.title }}</a>
    </div>
  {% endfor %}
</div>



