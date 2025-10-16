import React from "react";
import { Card, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { Sprout, MapPin, ArrowRight } from "lucide-react";

export default function FarmLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-5 md:p-8">
      <Card className="w-full max-w-xl rounded-2xl shadow-sm ring-1 ring-black/5 bg-white p-6 text-center">
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <Sprout className="text-emerald-700" size={26} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">Your Farm Dashboard</h1>
          <p className="text-gray-600 mb-6 max-w-sm">
            You’ll be able to view your farmland plots here once you’ve completed a purchase.
            <br />
            Explore available farms to get started.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              type="primary"
              className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
              onClick={() => navigate("/land-purchase")}
              icon={<ArrowRight size={16} />}
            >
              Explore Available Farms
            </Button>

            {/* <Button
              className="border-emerald-200 text-emerald-700 hover:!bg-emerald-50"
              onClick={() => navigate("/farm/ilora")}
              icon={<MapPin size={16} />}
            >
              View Ilora Farm Map
            </Button> */}
          </div>

          <div className="text-xs text-gray-500 mt-6">
            Once your purchase is confirmed, your owned plots and certificates
            will appear automatically on this page.
          </div>
        </div>
      </Card>
    </div>
  );
}
