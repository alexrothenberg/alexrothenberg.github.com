---
title: Alex Rothenberg
layout: master
---

<ul class="posts">
  {% for post in site.posts %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>

<div>
  Speaker at OSCON 2010 [Off the Beaten Path: Using Rails in the Enterprise](http://www.oscon.com/oscon2010/public/schedule/detail/13664)
</div>
