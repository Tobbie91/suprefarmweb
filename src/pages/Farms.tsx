// src/pages/FarmUpdates.tsx
import React, { useEffect, useState } from "react";
import { Card, Skeleton, Empty, Tag } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { Sprout, Play, MapPin } from "lucide-react";

const sampleUpdates = [
  {
    id: 1,
    farmId: "supre-001",
    title: "New Crop Planting in Ilora",
    summary: "Palm seedlings established; irrigation lines tested.",
    videoUrl: "/farm_update_video_1.mp4",
    thumb: "https://images.unsplash.com/photo-1498601761256-1efd9884068e?q=80&w=1200&auto=format&fit=crop",
    date: "2025-09-20",
    location: "Ilora, Oyo, Nigeria",
  },
  {
    id: 2,
    farmId: "supre-001",
    title: "Sustainability Practices",
    summary: "Cover crops added; soil organic matter rising.",
    videoUrl: "/farm_update_video_2.mp4",
    thumb: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop",
    date: "2025-09-17",
    location: "Ilora, Oyo, Nigeria",
  },
  {
    id: 3,
    farmId: "supre-002",
    title: "Weather Impact",
    summary: "Heavy rains; access routes re-marked to avoid waterlogged areas.",
    videoUrl: "/farm_update_video_3.mp4",
    thumb: "https://images.unsplash.com/photo-1535909339361-9b08486e4941?q=80&w=1200&auto=format&fit=crop",
    date: "2025-09-15",
    location: "Ashanti, Ghana",
  },
];

const panel = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";

export default function FarmUpdates() {
  const [params] = useSearchParams();
  const filterFarmId = params.get("farmId") || undefined;

  const [updates, setUpdates] = useState<typeof sampleUpdates>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with your backend fetch: /api/farm-updates?farmId=...
    setTimeout(() => {
      const rows = filterFarmId
        ? sampleUpdates.filter((u) => u.farmId === filterFarmId)
        : sampleUpdates;
      setUpdates(rows);
      setLoading(false);
    }, 600);
  }, [filterFarmId]);

  return (
    <div className="min-h-screen bg-[#F6F8FB] px-5 md:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
            <Sprout className="text-emerald-700" size={20} />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-semibold text-gray-800">Farm Updates</div>
            <div className="text-gray-600 text-sm">
              Latest reports, videos, and notes from your farms.
            </div>
          </div>
        </div>

        <Card className={panel}>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} active avatar paragraph={{ rows: 3 }} />
              ))}
            </div>
          ) : updates.length === 0 ? (
            <Empty description="No updates yet. Check back soon." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {updates.map((u) => (
                <Link key={u.id} to={`/farm-updates/${u.id}`} className="group">
                  <div className="overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white">
                    <div className="relative h-40 w-full">
                      <img
                        src={u.thumb}
                        alt=""
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/40 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                          <Play size={14} /> Video Update
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-base font-semibold text-gray-800 line-clamp-1">
                        {u.title}
                      </div>
                      <div className="mt-1 text-sm text-gray-600 line-clamp-2">{u.summary}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {dayjs(u.date).format("MMM D, YYYY")}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <MapPin size={12} className="text-emerald-700" />
                          {u.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}



