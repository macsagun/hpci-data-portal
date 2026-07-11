export type Week = {
  date: string; // "YYYY-MM-DD"
  regulars: number;
  vip: number;
  giving: number;
  sermon: string;
  preacher: string;
};

export type ParsedSubmission = {
  church: string;
  monthKey: string; // "YYYY-MM"
  weeks: Week[];
  wins: string;
  challenges: string;
};

export type Stats = {
  n: number;
  avgAtt: number;
  avgReg: number;
  totalVip: number;
  giving: number;
};
