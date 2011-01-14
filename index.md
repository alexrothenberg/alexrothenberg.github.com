---
title: Alex Rothenberg
layout: master
---

<div class="posts">
  {% for post in site.posts %}
    <div class="post">
      <div class="title"><a href="{{ post.url }}">{{ post.title }}</a></div>
      <div class="date">{{ post.date | date: "%B %d, %Y" }}</div>
      <div class="extract">{{post.content | strip_html | truncatewords:80}}</div>
    </div>
  {% endfor %}
</div>



