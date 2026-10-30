import React from 'react';

const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  badge,
  badgeType = 'emerald',
  highlight = false
}) => {
  const getBadgeClass = () => {
    switch (badgeType) {
      case 'amber':
        return 'badge-amber';
      case 'rose':
        return 'badge-rose';
      case 'slate':
        return 'badge-slate';
      case 'emerald':
      default:
        return 'badge-emerald';
    }
  };

  return (
    <div
      className={`card-premium p-5 flex flex-col justify-between transition-all hover:translate-y-[-1px] hover:shadow-card ${
        highlight ? 'border-emerald-200 bg-linear-to-b from-white to-emerald-50/20' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          </div>
        </div>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              highlight
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 mt-1">
        {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
        {badge && <span className={getBadgeClass()}>{badge}</span>}
        {trend && (
          <span
            className={`font-semibold ${
              trendPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
