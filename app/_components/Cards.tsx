import React from 'react';

interface ProjectCardProps {
  date: string;
  location: string;
  title: string;
  schedule: string;
  amount: string;
  client: string;
  status: 'recruiting' | 'completed';
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  date,
  location,
  title,
  schedule,
  amount,
  client,
  status
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-50 relative overflow-hidden transition-transform hover:scale-[1.01] cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{date}</p>
          <div className="flex items-center text-slate-700 font-bold">
            <span className="mr-1">›</span>
            <span>{location}</span>
          </div>
        </div>
        <span className={`px-4 py-1 md:px-6 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold text-white ${
          status === 'recruiting' ? 'bg-brand-green' : 'bg-slate-500'
        }`}>
          {status === 'recruiting' ? '募集中' : '完了'}
        </span>
      </div>

      <h3 className={`text-2xl font-bold mb-4 ${
        status === 'recruiting' ? 'text-brand-green' : 'text-slate-700'
      }`}>
        {title}
      </h3>

      <div className="space-y-2 text-slate-700 font-medium">
        <p>・日程：{schedule}</p>
        <p>・金額：{amount}</p>
        <p>・発注者：{client}</p>
      </div>
    </div>
  );
};

interface RequestCardProps {
  date: string;
  location: string;
  availableDates: string;
  skills: string;
  preference: string;
  company: string;
  status: 'recruiting' | 'completed';
}

export const RequestCard: React.FC<RequestCardProps> = ({
  date,
  location,
  availableDates,
  skills,
  preference,
  company,
  status
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-50 relative overflow-hidden transition-transform hover:scale-[1.01] cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{date}</p>
          <div className="flex items-center text-slate-700 font-bold">
            <span className="mr-1">›</span>
            <span>{location}</span>
          </div>
        </div>
        <span className={`px-4 py-1 md:px-6 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold text-white ${
          status === 'recruiting' ? 'bg-brand-green' : 'bg-slate-500'
        }`}>
          {status === 'recruiting' ? '募集中' : '完了'}
        </span>
      </div>

      <h3 className="text-2xl font-bold mb-4 text-brand-green leading-tight">
        {availableDates}
      </h3>

      <div className="space-y-2 text-slate-700 font-medium">
        <p>・調査可能内容：{skills}</p>
        <p>・希望：{preference}</p>
        <p>・企業：{company}</p>
      </div>
    </div>
  );
};
