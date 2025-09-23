import React, { useMemo, useState } from "react";
import {
  Card,
  Input,
  Select,
  DatePicker,
  Tag,
  Pagination,
  Empty,
  Button,
} from "antd";
import { Link, useSearchParams } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import { Sprout, MapPin, CalendarRange, ArrowRight } from "lucide-react";

const { RangePicker } = DatePicker;

type Report = {
  id: number | string;
  title: string;
  summary: string;
  cover: string;
  date: string; // ISO
  farmId?: string;
  farmName?: string;
  location?: string;
  tags?: string[];
  videoUrl?: string;
};

const SAMPLE_REPORTS: Report[] = [
  {
    id: 101,
    title: "Planting Day — Palm Seedlings",
    summary:
      "Palm seedlings established with improved spacing; drip irrigation checks completed and soil moisture in target band.",
    cover:
      "https://images.unsplash.com/photo-1524593610308-3a35c729ef2d?q=80&w=1600&auto=format&fit=crop",
    date: "2025-09-20",
    farmId: "supre-001",
    farmName: "Supre Farm — Ilora Block A",
    location: "Ilora, Oyo, Nigeria",
    tags: ["Planting", "Irrigation", "Operations"],
    videoUrl: "/farm_update_video_1.mp4",
  },
  {
    id: 102,
    title: "Sustainability Practices",
    summary:
      "Cover crops added to reduce erosion and boost organic matter; compost trials initiated on northern plots.",
    cover:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1600&auto=format&fit=crop",
    date: "2025-09-17",
    farmId: "supre-001",
    farmName: "Supre Farm — Ilora Block A",
    location: "Ilora, Oyo, Nigeria",
    tags: ["Sustainability", "Soil"],
    videoUrl: "/farm_update_video_2.mp4",
  },
  {
    id: 103,
    title: "Weather Watch — Heavy Rains Expected",
    summary:
      "48-hour rain window forecast. Field access routes re-marked; drainage inspection checklist shared with crew.",
    cover:
      "https://images.unsplash.com/photo-1520781359717-3eb98461c9fe?q=80&w=1600&auto=format&fit=crop",
    date: "2025-09-15",
    farmId: "supre-002",
    farmName: "Eastern Ridge",
    location: "Ashanti, Ghana",
    tags: ["Weather", "Logistics", "Safety"],
    videoUrl: "/farm_update_video_3.mp4",
  },
];

const panel = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";

export default function Reports() {
  const [params] = useSearchParams();
  const initialFarm = params.get("farmId") || "All";

  // Filters
  const [q, setQ] = useState("");
  const [farm, setFarm] = useState<string>(initialFarm);
  const allFarms = useMemo(
    () => ["All", ...Array.from(new Set(SAMPLE_REPORTS.map((r) => r.farmName || "Unassigned")))],
    []
  );
  const allTags = useMemo(
    () => Array.from(new Set(SAMPLE_REPORTS.flatMap((r) => r.tags || []))),
    []
  );
  const [tags, setTags] = useState<string[]>([]);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  const filtered = useMemo(() => {
    let rows = [...SAMPLE_REPORTS];

    // Search
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          r.summary.toLowerCase().includes(s) ||
          (r.location || "").toLowerCase().includes(s)
      );
    }

    // Farm
    if (farm !== "All") {
      rows = rows.filter((r) => (r.farmName || "Unassigned") === farm);
    }

    // Tags (any of selected tags)
    if (tags.length) {
      rows = rows.filter((r) => r.tags?.some((t) => tags.includes(t)));
    }

    // Date range
    if (range?.[0] && range?.[1]) {
      const start = range[0].startOf("day");
      const end = range[1].endOf("day");
      rows = rows.filter((r) => {
        const d = dayjs(r.date);
        return d.isAfter(start) && d.isBefore(end);
      });
    }

    // Sort
    rows.sort((a, b) =>
      sort === "newest"
        ? dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
        : dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );

    return rows;
  }, [q, farm, tags, range, sort]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#F6F8FB] px-5 md:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero */}
        <div className="mb-6 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
            <Sprout className="text-emerald-700" size={20} />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-semibold text-gray-800">Reports</div>
            <div className="text-gray-600 text-sm">
              All farm updates, stories, and weather notes — in one feed.
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${panel} p-4 md:p-5 mb-6`}>
          <div className="grid gap-4 md:grid-cols-[1.5fr,1fr,1fr,1fr,1fr] items-end">
            <div>
              <div className="text-sm text-gray-700 mb-1">Search</div>
              <Input
                placeholder="Search title, summary, location"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
              />
            </div>
            <div>
              <div className="text-sm text-gray-700 mb-1">Farm</div>
              <Select
                value={farm}
                onChange={(v) => {
                  setPage(1);
                  setFarm(v);
                }}
                className="w-full"
                options={allFarms.map((f) => ({ value: f, label: f }))}
              />
            </div>
            <div>
              <div className="text-sm text-gray-700 mb-1">Tags</div>
              <Select
                mode="multiple"
                allowClear
                placeholder="All tags"
                value={tags}
                onChange={(v) => {
                  setPage(1);
                  setTags(v);
                }}
                className="w-full"
                options={allTags.map((t) => ({ value: t, label: t }))}
              />
            </div>
            <div>
              <div className="text-sm text-gray-700 mb-1 flex items-center gap-1">
                <CalendarRange size={14} /> Date Range
              </div>
              <RangePicker
                className="w-full"
                value={range as any}
                onChange={(v) => {
                  setPage(1);
                  setRange(v as any);
                }}
                allowClear
              />
            </div>
            <div>
              <div className="text-sm text-gray-700 mb-1">Sort</div>
              <Select
                value={sort}
                onChange={(v) => setSort(v)}
                className="w-full"
                options={[
                  { value: "newest", label: "Newest first" },
                  { value: "oldest", label: "Oldest first" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Grid of posts */}
        <div className={`${panel} p-4 md:p-5`}>
          {pageRows.length === 0 ? (
            <Empty description="No reports match your filters." />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pageRows.map((r) => (
                  <Card
                    key={r.id}
                    className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5"
                    bodyStyle={{ padding: 0 }}
                    hoverable
                  >
                    <Link to={`/reports/${r.id}`} className="block">
                      <div className="relative h-44 w-full">
                        <img
                          src={r.cover}
                          alt={r.title}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <div className="absolute bottom-3 left-3 rounded-md bg-white/90 backdrop-blur px-2 py-1 text-xs font-medium">
                          {dayjs(r.date).format("MMM D, YYYY")}
                        </div>
                      </div>
                    </Link>

                    <div className="p-4">
                      <Link
                        to={`/reports/${r.id}`}
                        className="text-base font-semibold text-gray-800 line-clamp-2 hover:underline"
                      >
                        {r.title}
                      </Link>

                      <div className="mt-1 text-sm text-gray-600 line-clamp-3">{r.summary}</div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {r.tags?.slice(0, 3).map((t) => (
                          <Tag key={t} className="bg-emerald-50 text-emerald-800 border-emerald-200">
                            {t}
                          </Tag>
                        ))}
                        {r.location && (
                          <span className="ml-auto text-xs text-gray-600 flex items-center gap-1">
                            <MapPin size={12} className="text-emerald-700" />
                            {r.location}
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <Link to={`/reports/${r.id}`}>
                          <Button
                            type="default"
                            className="border-emerald-200 text-emerald-700 hover:!bg-emerald-50"
                          >
                            Read report <ArrowRight size={16} className="ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <Pagination
                  current={page}
                  pageSize={PAGE_SIZE}
                  total={filtered.length}
                  onChange={(p) => setPage(p)}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
