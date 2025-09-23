import { useState } from "react";

interface Farm {
  name: string;
  location: string;
  pricePerPlot: number;
  totalPlots: number;
  remainingPlots: number;
  legalAgreementFee: number;  // Fee for legal agreements
}

const farms: Farm[] = [
  {
    name: "Ilora, Oyo State",
    location: "ilora",
    pricePerPlot: 50000, // Price for one plot
    totalPlots: 100,
    remainingPlots: 85,
    legalAgreementFee: 15000,  // Example legal agreement fee
  },
  {
    name: "Ilaji, Oyo State",
    location: "ilaji",
    pricePerPlot: 60000,
    totalPlots: 120,
    remainingPlots: 100,
    legalAgreementFee: 18000,
  },
  {
    name: "Iseyin, Oyo State",
    location: "iseyin",
    pricePerPlot: 55000,
    totalPlots: 150,
    remainingPlots: 120,
    legalAgreementFee: 16000,
  },
  {
    name: "Ashanti Region, Ghana",
    location: "ghana",
    pricePerPlot: 70000,
    totalPlots: 80,
    remainingPlots: 60,
    legalAgreementFee: 20000,
  },
];

const PlotPurchase: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(farms[0]);
  const [numPlots, setNumPlots] = useState<number>(1);
  const [includeSurvey, setIncludeSurvey] = useState<boolean>(false);
  const [totalPrice, setTotalPrice] = useState<number>(selectedFarm?.pricePerPlot || 0);
  const [legalAgreementChecked, setLegalAgreementChecked] = useState<boolean>(false);

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const farm = farms.find((f) => f.location === e.target.value);
    setSelectedFarm(farm || farms[0]);
    setNumPlots(1); // Reset the number of plots
    setLegalAgreementChecked(false); // Reset legal agreement checkbox
    calculateTotalPrice(1); // Recalculate price
  };

  const handlePlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const plotCount = parseInt(e.target.value, 10);
    setNumPlots(plotCount);
    calculateTotalPrice(plotCount);
  };

  const handleSurveyChange = () => {
    setIncludeSurvey((prev) => !prev);
    calculateTotalPrice(numPlots);
  };

  const handleLegalAgreementChange = () => {
    setLegalAgreementChecked((prev) => !prev);
    calculateTotalPrice(numPlots);
  };

  const calculateTotalPrice = (plotCount: number) => {
    if (!selectedFarm) return;
    const surveyFee = includeSurvey ? 10000 : 0;
    const legalAgreementFee = legalAgreementChecked ? selectedFarm.legalAgreementFee : 0;
    const price = selectedFarm.pricePerPlot * plotCount + surveyFee + legalAgreementFee;
    setTotalPrice(price);
  };

  const handleBuy = () => {
    alert("Plot purchased successfully! A plot has been assigned.");
    // Logic for plot assignment can go here, like updating the remaining plots or sending an API request.
  };

  return (
    <div className="container mx-auto py-8 px-6">
      <h1 className="text-3xl font-bold text-center text-emerald-800 mb-8">Buy a Plot or Hectare</h1>

      {/* Farm Selection */}
      <div className="mb-6">
        <label htmlFor="farm" className="block text-lg font-medium text-gray-700">
          Select Farm Location
        </label>
        <select
          id="farm"
          value={selectedFarm?.location}
          onChange={handleFarmChange}
          className="mt-2 p-2 border rounded-lg w-full"
        >
          {farms.map((farm) => (
            <option key={farm.location} value={farm.location}>
              {farm.name}
            </option>
          ))}
        </select>
      </div>

      {/* Plot Selection */}
      <div className="mb-6">
        <label htmlFor="plots" className="block text-lg font-medium text-gray-700">
          Select Number of Plots (Available: {selectedFarm?.remainingPlots})
        </label>
        <input
          id="plots"
          type="number"
          value={numPlots}
          onChange={handlePlotChange}
          min="1"
          max={selectedFarm?.remainingPlots}
          className="mt-2 p-2 border rounded-lg w-full"
        />
      </div>

      {/* Survey Option */}
      <div className="mb-6 flex items-center">
        <input
          type="checkbox"
          id="survey"
          checked={includeSurvey}
          onChange={handleSurveyChange}
          className="mr-2"
        />
        <label htmlFor="survey" className="text-lg font-medium text-gray-700">
          Include Survey (Price: 10,000 NGN)
        </label>
      </div>

      {/* Legal Agreement Option */}
      <div className="mb-6 flex items-center">
        <input
          type="checkbox"
          id="legalAgreement"
          checked={legalAgreementChecked}
          onChange={handleLegalAgreementChange}
          className="mr-2"
        />
        <label htmlFor="legalAgreement" className="text-lg font-medium text-gray-700">
          Include Legal Agreement (Price: {selectedFarm?.legalAgreementFee.toLocaleString()} NGN)
        </label>
      </div>

      {/* Price Details */}
      <div className="mb-6">
        <p className="text-lg">
          <strong>Total Price: </strong>
          {totalPrice.toLocaleString()} NGN
        </p>
        {!includeSurvey && (
          <p className="text-sm text-gray-600">
            Note: If you don't include the survey now, you'll pay 50% more for the legal agreements later.
          </p>
        )}
      </div>

      {/* Buy Button */}
      <div className="text-center">
        <button
          onClick={handleBuy}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default PlotPurchase;
