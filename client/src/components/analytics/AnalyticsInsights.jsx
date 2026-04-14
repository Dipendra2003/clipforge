function AnalyticsInsights({ analyticsData, topClips, platformData }) {
  if (!analyticsData || !topClips || !platformData) {
    return null;
  }

  const insights = [];

  // Insight 1: Best performing clip
  if (topClips.length > 0) {
    const bestClip = topClips[0];
    insights.push({
      icon: '🏆',
      title: 'Top Performer',
      description: `"${bestClip.title}" has ${bestClip.views.toLocaleString()} views with ${bestClip.engagementRate}% engagement rate.`,
      color: 'purple',
      action: bestClip.platformUrl ? { text: 'View', url: bestClip.platformUrl } : null
    });
  }

  // Insight 2: Engagement rate analysis
  const engagementRate = analyticsData.engagementRate;
  if (engagementRate > 0) {
    let engagementInsight = '';
    let engagementColor = 'blue';
    
    if (engagementRate >= 10) {
      engagementInsight = 'Excellent! Your engagement rate is outstanding. Keep creating this quality content.';
      engagementColor = 'green';
    } else if (engagementRate >= 7) {
      engagementInsight = 'Great engagement! Your audience is highly interactive with your content.';
      engagementColor = 'blue';
    } else if (engagementRate >= 5) {
      engagementInsight = 'Good engagement rate. Consider adding more calls-to-action to boost interaction.';
      engagementColor = 'yellow';
    } else if (engagementRate >= 3) {
      engagementInsight = 'Fair engagement. Try creating more interactive content to increase audience participation.';
      engagementColor = 'orange';
    } else {
      engagementInsight = 'Low engagement detected. Focus on creating more compelling content and stronger hooks.';
      engagementColor = 'red';
    }

    insights.push({
      icon: '📊',
      title: 'Engagement Analysis',
      description: engagementInsight,
      color: engagementColor
    });
  }

  // Insight 3: Growth trend
  if (analyticsData.changes && analyticsData.changes.views !== 0) {
    const viewsChange = analyticsData.changes.views;
    const isGrowing = viewsChange > 0;
    
    insights.push({
      icon: isGrowing ? '📈' : '📉',
      title: isGrowing ? 'Growing Audience' : 'Declining Views',
      description: `Your views ${isGrowing ? 'increased' : 'decreased'} by ${Math.abs(viewsChange).toFixed(1)}% compared to the previous period.`,
      color: isGrowing ? 'green' : 'red'
    });
  }

  // Insight 4: Platform performance
  if (platformData.youtube && platformData.youtube.postsCount > 0) {
    const avgViews = parseInt(platformData.youtube.avgViews);
    const avgLikes = parseInt(platformData.youtube.avgLikes);
    
    if (avgViews > 0) {
      insights.push({
        icon: '▶️',
        title: 'YouTube Performance',
        description: `Your YouTube Shorts average ${avgViews.toLocaleString()} views and ${avgLikes.toLocaleString()} likes per post.`,
        color: 'red'
      });
    }
  }

  // Insight 5: Content consistency
  if (analyticsData.totalPosts > 0) {
    let consistencyMessage = '';
    let consistencyColor = 'blue';
    
    if (analyticsData.totalPosts >= 20) {
      consistencyMessage = `You've published ${analyticsData.totalPosts} clips! Consistent posting is key to growth.`;
      consistencyColor = 'green';
    } else if (analyticsData.totalPosts >= 10) {
      consistencyMessage = `${analyticsData.totalPosts} clips published. Keep up the momentum!`;
      consistencyColor = 'blue';
    } else if (analyticsData.totalPosts >= 5) {
      consistencyMessage = `${analyticsData.totalPosts} clips so far. Try posting more consistently for better reach.`;
      consistencyColor = 'yellow';
    } else {
      consistencyMessage = `You have ${analyticsData.totalPosts} clips. Post more regularly to build your audience.`;
      consistencyColor = 'orange';
    }

    insights.push({
      icon: '📅',
      title: 'Content Consistency',
      description: consistencyMessage,
      color: consistencyColor
    });
  }

  // Insight 6: Viral potential
  if (topClips.length > 0) {
    const highViralScoreClips = topClips.filter(clip => clip.viralScore && clip.viralScore >= 80);
    if (highViralScoreClips.length > 0) {
      insights.push({
        icon: '🔥',
        title: 'Viral Potential',
        description: `${highViralScoreClips.length} of your clips have high viral scores (80+). These are performing well!`,
        color: 'orange'
      });
    }
  }

  const colorClasses = {
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700'
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Insights & Recommendations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className={`p-4 border rounded-lg ${colorClasses[insight.color] || colorClasses.blue}`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{insight.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{insight.title}</h3>
                <p className="text-sm opacity-90">{insight.description}</p>
                {insight.action && (
                  <a
                    href={insight.action.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm font-medium underline hover:no-underline"
                  >
                    {insight.action.text} →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalyticsInsights;
