require 'rubygems'
require 'nokogiri'


class Comments
  attr_reader :doc
  attr_reader :newdoc
  
  def initialize(file_name='blogger-comments.xml')
    blogger_comments_file = File.expand_path(File.join(File.dirname(__FILE__), file_name))
    @doc = Nokogiri::XML(File.open(blogger_comments_file))
  end
  
  def posts
    doc.xpath('/disqus/thread')
  end
  
  def comments_for_post(post_id)
    doc.xpath %Q<//post[thread[@dsq:id="#{post_id}"]]>
  end

  def add_child node, new_tag, old_node, old_tag, cdata=false
    new_node = Nokogiri::XML::Node.new new_tag, @newdoc
    new_node.content = old_node.xpath(old_tag).text
    new_node.content = "<![CDATA[#{new_node.content}]]>" if cdata
    node.add_child(new_node)
  end

  def post2item post
    item = Nokogiri::XML::Node.new "item", @newdoc

    add_child(item, 'link',  post, 'link')
    add_child(item, 'title', post, 'title')
    
    comments = comments_for_post(post.attr('id'))
    comments.each do |comment|
      item.add_child process_comment(comment)
    end
    item
  end

  def process_comment comment
    wp_comment = Nokogiri::XML::Node.new "wp:comment", @newdoc

    # add_child(wp_comment, 'wp:comment_id',           comment, '@id')
    new_node = Nokogiri::XML::Node.new 'wp:comment_id', @newdoc
    new_node.content = comment.attr('id')
    wp_comment.add_child(new_node)

    add_child(wp_comment, 'wp:comment_author',       comment, 'author/name')
    add_child(wp_comment, 'wp:comment_author_email', comment, 'author/email')
    add_child(wp_comment, 'wp:comment_author_url',   comment, 'author/link')
    add_child(wp_comment, 'wp:comment_author_IP',    comment, 'ipAddress')
    # add_child(wp_comment, 'wp:comment_date_gmt',     comment, 'createdAt')
    new_node = Nokogiri::XML::Node.new 'wp:comment_date_gmt', @newdoc
    new_node.content = comment.xpath('createdAt').text.gsub('T',' ').gsub('Z', '') 
    wp_comment.add_child(new_node)
    
    add_child(wp_comment, 'wp:comment_content',      comment, 'message', true)

    wp_comment
  end

  def doit
    @newdoc = Nokogiri::XML <<-XML
    <rss xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.0/" version="2.0">
     <channel>
     </channel>
    </rss>
    XML
    root = @newdoc.xpath('rss/channel').first
    posts.each do |post|
      item = post2item(post)
      root.add_child(item)
    end
    
    @newdoc.to_s
  end
end

def comments
  Comments.new
end
