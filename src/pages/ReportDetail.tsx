import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Tag } from "antd";
import dayjs from "dayjs";
import { ArrowLeft, MapPin, Sprout } from "lucide-react";

// Reuse the same dataset or fetch from backend
const DATA = [
  // keep ids aligned with Reports.tsx
  {
    id: "101",
    title: "Planting Day — Palm Seedlings",
    cover:
      "https://images.unsplash.com/photo-1524593610308-3a35c729ef2d?q=80&w=1600&auto=format&fit=crop",
    date: "2025-09-20",
    location: "Ilora, Oyo, Nigeria",
    tags: ["Planting", "Irrigation", "Operations"],
    body: [
      "Today we established new rows of palm seedlings with improved spacing.",
      "Drip irrigation lines were tested and repaired across two blocks.",
      "Soil moisture readings returned to the target band after the maintenance.",
    ],
    videoUrl: "/farm_update_video_1.mp4",
  },
  // ... mirror the others if you like
];

const panel = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";

export default function ReportDetail() {
  const { id } = useParams();
  const post = useMemo(() => DATA.find((d) => String(d.id) === String(id)), [id]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] px-5 md:px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <Card className={panel}>
            <div className="p-6">
              <div className="text-lg font-semibold">Report not found</div>
              <div className="mt-3">
                <Link className="text-emerald-700 underline" to="/reports">
                  ← Back to Reports
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] px-5 md:px-8 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4">
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
          >
            <ArrowLeft size={16} /> Back to Reports
          </Link>
        </div>

        <div className={`${panel} overflow-hidden`}>
          <div className="relative h-64 w-full">
            <img src={post.cover} alt={post.title} className="h-full w-full object-cover" />
          </div>

          <div className="p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
                <Sprout className="text-emerald-700" size={20} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">{post.title}</h1>
                <div className="mt-1 text-sm text-gray-500 flex items-center gap-4">
                  <span>{dayjs(post.date).format("MMM D, YYYY")}</span>
                  {post.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-emerald-700" />
                      {post.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {post.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Tag key={t} className="bg-emerald-50 text-emerald-800 border-emerald-200">
                    {t}
                  </Tag>
                ))}
              </div>
            ) : null}

            {/* Content */}
            <div className="prose max-w-none mt-6">
              {post.body?.map((p, i) => (
                <p key={i} className="text-gray-700 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            {/* Video (optional) */}
            {post.videoUrl && (
              <div className="mt-6">
                <video
                  controls
                  className="w-full rounded-lg ring-1 ring-black/5"
                  poster={post.cover}
                >
                  <source src={post.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


