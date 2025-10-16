import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Tag, Image } from "antd";
import dayjs from "dayjs";
import { ArrowLeft, MapPin, Sprout } from "lucide-react";

import img1 from "../assets/images/1.jpg";
import img2 from "../assets/images/2.jpg";
import img3 from "../assets/images/3.jpg";
import img4 from "../assets/images/4.jpg";
import img5 from "../assets/images/5.jpg";
import img6 from "../assets/images/6.jpg";
import img7 from "../assets/images/7.jpg";
import img8 from "../assets/images/8.jpg";
import img9 from "../assets/images/9.jpg";
import img10 from "../assets/images/10.jpg";

type ReportPost = {
  id: string;
  title: string;
  cover: string;
  date: string;
  location?: string;
  tags?: string[];
  body?: string[];
  videoUrl?: string;
  images?: string[];
};

const DATA: ReportPost[] = [
  {
    id: "101",
    title: "Planting Day — Ilora Block A (Palm Seedlings)",
    cover: img2,
    images: [img3, img1, img2],
    date: "2025-09-15",
    location: "Ilora, Oyo, Nigeria",
    tags: ["Planting", "Operations", "Irrigation", "Soil"],
    body: [
      "We wrapped up a successful planting day at Ilora Block A, establishing palm seedlings across the prepared beds with a consistent 3×3 m spacing. This layout improves airflow, light distribution, and long-term access for maintenance.",
      "Before planting, the team completed final bed checks: compaction test on headlands, weed removal along ridges, and a quick run-through of the planting sequence to keep the line straight and spacing uniform.",
      "Drip irrigation lines were flushed and pressure-tested. Two minor leaks were fixed on the western edge; flow rates are now stable and within spec.",
      "Post-planting, each seedling received an initial watering. Soil moisture readings returned to the target band after a short irrigation cycle, reducing immediate transplant stress.",
      "All seedlings were staked and lightly mulched to retain moisture and minimize wind rock. We’ll monitor establishment over the next 7–10 days and replace any weak plants.",
      "Next steps: early weed control (hand rogueing), a light nutrient starter where needed, and a follow-up irrigation check at 48 hours.",
    ],
    videoUrl:
      "https://drive.google.com/file/d/1jVaChCoYwOPRqaWlNPuTkHIuf32phI9M/view?usp=drive_link",
  },
  {
    id: "102",
    title: "Perimeter Fencing Completed — Ilora Block A",
    cover: img5,
    images: [img4, img5, img6],
    date: "2025-09-30",
    location: "Ilora, Oyo, Nigeria",
    tags: ["Infrastructure", "Security", "Operations"],
    body: [
      "The field operations team has successfully completed perimeter fencing around Ilora Block A. The new structure provides improved security for the young palm seedlings and marks a major milestone in our early-stage infrastructure setup.",
      "The fence consists of treated wooden posts and galvanized wire mesh, designed to withstand weather exposure and prevent unauthorized livestock entry.",
      "Installation covered a perimeter length of approximately 1.2 km, with corner reinforcements and gated access points for maintenance vehicles.",
      "This investment ensures the farm’s sustainability by reducing damage from free-range grazing and clearly defining operational boundaries.",
      "Next on schedule: inspection of gate hinges after the first heavy rainfall and the beginning of the field signage phase.",
    ],
    videoUrl:
      "https://drive.google.com/file/d/13QUxFpnaTT-oQ_oXxE2FBhlizh2a1s24/view?usp=drive_link",
  },
  {
    id: "103",
    title: "Progress Update — Cleared Land and Early Growth",
    cover: img7,
    images: [img8, img9, img10],
    date: "2025-10-05",
    location: "Ilora, Oyo, Nigeria",
    tags: ["Progress", "Operations", "Planting", "Clearing"],
    body: [
      "As part of our ongoing field development, Ilora Block A has recorded strong progress through early October. All plots scheduled for the first phase of clearing have now been completed, graded, and prepared for soil improvement.",
      "The previously planted palm seedlings are showing encouraging growth, with over 95% establishment success and visible new leaves on the majority of the stand.",
      "The operations team completed an additional 0.8 hectares of land clearing using both mechanical and manual methods, ensuring minimal topsoil disturbance.",
      "Drainage channels have been reinforced to improve runoff management and prevent early erosion during the upcoming rains.",
      "With fencing now complete, focus shifts to routine irrigation checks, weed control, and preparation for the second round of planting scheduled for late October.",
    ],
    videoUrl:
      "https://drive.google.com/file/d/15q_2x3U-RLvdEcjYj72aWfVYTagJJrg9/view?usp=drive_link",
  },
];

const panel = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";

// helper: turn a Google Drive “view” URL into an embeddable preview URL
function toDrivePreview(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/\/d\/([^/]+)\//);
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
}

export default function ReportDetail() {
  const { id } = useParams();
  const post = useMemo(
    () => DATA.find((d) => String(d.id) === String(id)),
    [id]
  );

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

  const drivePreview = toDrivePreview(post.videoUrl);

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
            <img
              src={post.cover}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
                <Sprout className="text-emerald-700" size={20} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
                  {post.title}
                </h1>
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

            {post.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Tag
                    key={t}
                    className="bg-emerald-50 text-emerald-800 border-emerald-200"
                  >
                    {t}
                  </Tag>
                ))}
              </div>
            ) : null}

            {post.images?.length ? (
              <div className="mt-5">
                <Image.PreviewGroup>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(post.images.filter(Boolean) as string[]).map(
                      (src, idx) => (
                        <Image
                          key={idx}
                          src={src}
                          alt={`Gallery ${idx + 1}`}
                          className="rounded-lg ring-1 ring-black/5 object-cover"
                          style={{ width: "100%", height: 160 }}
                        />
                      )
                    )}
                  </div>
                </Image.PreviewGroup>
              </div>
            ) : null}

            {/* Body */}
            <div className="prose max-w-none mt-6">
              {post.body?.map((p, i) => (
                <p key={i} className="text-gray-700 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            {/* Video — use iframe for Google Drive; fallback to <video> for normal mp4s */}
            {post.videoUrl && (
              <div className="mt-6">
                {drivePreview ? (
                  <iframe
                    title="Drive preview"
                    src={drivePreview}
                    allow="autoplay"
                    className="w-full h-[420px] rounded-lg ring-1 ring-black/5"
                  />
                ) : (
                  <video
                    controls
                    className="w-full rounded-lg ring-1 ring-black/5"
                    poster={post.cover}
                  >
                    <source src={post.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


