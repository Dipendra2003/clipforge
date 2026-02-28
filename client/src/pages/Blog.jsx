import { Link } from 'react-router-dom';

function Blog() {
  const blogPosts = [
    {
      id: 1,
      title: "10 Tips for Creating Viral Short-Form Content",
      excerpt: "Learn the secrets to creating content that captures attention and drives engagement across all platforms.",
      category: "Content Strategy",
      date: "Feb 10, 2026",
      readTime: "5 min read",
      image: "bg-gradient-to-br from-purple-400 to-indigo-500"
    },
    {
      id: 2,
      title: "How AI is Revolutionizing Video Editing",
      excerpt: "Discover how artificial intelligence is transforming the video editing landscape and what it means for creators.",
      category: "AI & Technology",
      date: "Feb 8, 2026",
      readTime: "7 min read",
      image: "bg-gradient-to-br from-blue-400 to-cyan-500"
    },
    {
      id: 3,
      title: "The Ultimate Guide to YouTube Shorts",
      excerpt: "Everything you need to know about creating, optimizing, and growing with YouTube Shorts in 2026.",
      category: "Platform Guides",
      date: "Feb 5, 2026",
      readTime: "10 min read",
      image: "bg-gradient-to-br from-red-400 to-pink-500"
    },
    {
      id: 4,
      title: "Emotion Detection: The Future of Content Analysis",
      excerpt: "How emotion-based AI is helping creators identify the most engaging moments in their videos.",
      category: "AI & Technology",
      date: "Feb 3, 2026",
      readTime: "6 min read",
      image: "bg-gradient-to-br from-green-400 to-emerald-500"
    },
    {
      id: 5,
      title: "Instagram Reels vs TikTok: Which Platform is Right for You?",
      excerpt: "A comprehensive comparison to help you decide where to focus your short-form content efforts.",
      category: "Platform Guides",
      date: "Jan 30, 2026",
      readTime: "8 min read",
      image: "bg-gradient-to-br from-orange-400 to-yellow-500"
    },
    {
      id: 6,
      title: "Case Study: How One Creator Grew 500K Followers in 3 Months",
      excerpt: "Real strategies and insights from a creator who leveraged AI-powered clipping to explode their growth.",
      category: "Success Stories",
      date: "Jan 28, 2026",
      readTime: "12 min read",
      image: "bg-gradient-to-br from-indigo-400 to-purple-500"
    }
  ];

  const categories = ["All", "Content Strategy", "AI & Technology", "Platform Guides", "Success Stories"];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              ClipForge Blog
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Tips, insights, and strategies for content creators
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  category === "All"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <span className="inline-block px-3 py-1 bg-white/20 text-white text-sm font-semibold rounded-full mb-4 w-fit">
                  Featured Post
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  The Complete Guide to AI-Powered Video Editing in 2026
                </h2>
                <p className="text-purple-100 mb-6">
                  Everything you need to know about leveraging AI to transform your video content strategy and save hours of editing time.
                </p>
                <div className="flex items-center text-purple-100 text-sm mb-6">
                  <span>Feb 12, 2026</span>
                  <span className="mx-2">•</span>
                  <span>15 min read</span>
                </div>
                <Link to="/blog/1" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition w-fit">
                  Read Article
                </Link>
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-indigo-500 h-64 lg:h-auto"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group">
                <div className={`h-48 ${post.image}`}></div>
                <div className="p-6">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-600 text-xs font-semibold rounded-full mb-3">
                    {post.category}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <Link to={`/blog/${post.id}`} className="mt-4 inline-block text-purple-600 font-semibold hover:text-purple-700">
                    Read More →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-lg text-purple-100 mb-8">
            Get the latest tips, insights, and updates delivered to your inbox every week
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-lg focus:ring-2 focus:ring-white focus:outline-none"
            />
            <button
              type="submit"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Subscribe
            </button>
          </form>
          <p className="text-sm text-purple-100 mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Blog;
