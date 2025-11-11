import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EnergyMarkers from "../../components/ui/EnergyMarkers";

describe("EnergyMarkers", () => {
  const mockGameConfig = {
    ringData: [
      {
        id: 1,
        innerRadius: 200,
        outerRadius: 350,
        labels: [
          { id: 1, text: "Action 1", color: "#ffc072", energyvalue: 1 },
          { id: 2, text: "Action 2", color: "#ffb088", energyvalue: 2 },
          { id: 3, text: "Action 3", color: "#ffc072", energyvalue: 3 },
        ]
      }
    ]
  };

  const mockRotations = { 1: 0 };
  const centerX = 800;
  const centerY = 800;

  it("renders markers for active marker IDs using composite keys", () => {
    const mockActiveMarkers = new Set(["1-1", "1-2"]);
    
    render(
      <svg>
        <EnergyMarkers
          gameConfig={mockGameConfig}
          rotations={mockRotations}
          activeMarkers={mockActiveMarkers}
          centerX={centerX}
          centerY={centerY}
        />
      </svg>
    );

    expect(screen.getByTestId("energy-marker-1")).toBeInTheDocument();
    expect(screen.getByTestId("energy-marker-2")).toBeInTheDocument();
  });

  it("does not render markers for inactive marker IDs", () => {
    const mockActiveMarkers = new Set(["1-1"]);
    
    render(
      <svg>
        <EnergyMarkers
          gameConfig={mockGameConfig}
          rotations={mockRotations}
          activeMarkers={mockActiveMarkers}
          centerX={centerX}
          centerY={centerY}
        />
      </svg>
    );

    expect(screen.getByTestId("energy-marker-1")).toBeInTheDocument();
    expect(screen.queryByTestId("energy-marker-2")).not.toBeInTheDocument();
  });

  it("renders no markers when activeMarkers is empty", () => {
    const mockActiveMarkers = new Set();
    
    render(
      <svg>
        <EnergyMarkers
          gameConfig={mockGameConfig}
          rotations={mockRotations}
          activeMarkers={mockActiveMarkers}
          centerX={centerX}
          centerY={centerY}
        />
      </svg>
    );

    expect(screen.queryByTestId("energy-marker-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("energy-marker-2")).not.toBeInTheDocument();
  });

  it("renders markers for labels with different energy values", () => {
    // Test that markers render correctly for labels with energyvalue 1, 2, and 3
    const mockActiveMarkers = new Set(["1-1", "1-2", "1-3"]);
    
    render(
      <svg>
        <EnergyMarkers
          gameConfig={mockGameConfig}
          rotations={mockRotations}
          activeMarkers={mockActiveMarkers}
          centerX={centerX}
          centerY={centerY}
        />
      </svg>
    );

    // All three markers should render regardless of their energy values
    expect(screen.getByTestId("energy-marker-1")).toBeInTheDocument();
    expect(screen.getByTestId("energy-marker-2")).toBeInTheDocument();
    expect(screen.getByTestId("energy-marker-3")).toBeInTheDocument();
  });

  it("handles labels with high energy values correctly", () => {
    const highEnergyConfig = {
      ringData: [
        {
          id: 1,
          innerRadius: 200,
          outerRadius: 350,
          labels: [
            { id: 1, text: "Expensive Action", color: "#ffc072", energyvalue: 10 },
            { id: 2, text: "Very Expensive", color: "#ffb088", energyvalue: 25 },
          ]
        }
      ]
    };

    const mockActiveMarkers = new Set(["1-1", "1-2"]);
    
    render(
      <svg>
        <EnergyMarkers
          gameConfig={highEnergyConfig}
          rotations={mockRotations}
          activeMarkers={mockActiveMarkers}
          centerX={centerX}
          centerY={centerY}
        />
      </svg>
    );

    expect(screen.getByTestId("energy-marker-1")).toBeInTheDocument();
    expect(screen.getByTestId("energy-marker-2")).toBeInTheDocument();
  });

  it("handles multiple rings with different ring IDs", () => {
    const multiRingConfig = {
      ringData: [
        {
          id: 1,
          innerRadius: 200,
          outerRadius: 350,
          labels: [
            { id: 1, text: "Action 1", color: "#ffc072", energyvalue: 1 },
          ]
        },
        {
          id: 2,
          innerRadius: 350,
          outerRadius: 500,
          labels: [
            { id: 11, text: "Action 11", color: "#a3d7ff", energyvalue: 2 },
          ]
        }
      ]
    };

    const mockActiveMarkers = new Set(["1-1", "2-11"]);
    const mockRotations = { 1: 0, 2: 0 };
    
    render(
      <svg>
        <EnergyMarkers
          gameConfig={multiRingConfig}
          rotations={mockRotations}
          activeMarkers={mockActiveMarkers}
          centerX={centerX}
          centerY={centerY}
        />
      </svg>
    );

    expect(screen.getByTestId("energy-marker-1")).toBeInTheDocument();
    expect(screen.getByTestId("energy-marker-11")).toBeInTheDocument();
  });

  it("applies rotation transform to marker groups", () => {
    const mockActiveMarkers = new Set(["1-1"]);
    const mockRotations = { 1: 45 };

    const { container } = render(
      <svg>
        <EnergyMarkers
          gameConfig={mockGameConfig}
          rotations={mockRotations}
          activeMarkers={mockActiveMarkers}
          centerX={centerX}
          centerY={centerY}
        />
      </svg>
    );

    const markerGroup = container.querySelector('g[transform*="rotate(45"]');
    expect(markerGroup).toBeInTheDocument();
  });

  it("uses correct energy icons based on energyvalue", () => {
    const testConfig = {
      ringData: [{
        id: 1,
        innerRadius: 200,
        outerRadius: 350,
        labels: [
          { id: 1, text: "Action 1", color: "#ffc072", energyvalue: 1 },
          { id: 2, text: "Action 2", color: "#ffb088", energyvalue: 2 },
          { id: 3, text: "Action 3", color: "#ffc072", energyvalue: 3 },
          { id: 4, text: "Action 4", color: "#ffb088", energyvalue: 4 },
          { id: 5, text: "Action 5", color: "#ffc072", energyvalue: 10 },
        ]
      }]
    };

    const mockActiveMarkers = new Set(["1-1", "1-2", "1-3", "1-4", "1-5"]);

    render(
      <svg>
        <EnergyMarkers
          gameConfig={testConfig}
          rotations={mockRotations}
          activeMarkers={mockActiveMarkers}
          centerX={centerX}
          centerY={centerY}
        />
      </svg>
    );

    expect(screen.getByTestId("energy-marker-1").getAttribute('href')).toContain('energy1.png');
    expect(screen.getByTestId("energy-marker-2").getAttribute('href')).toContain('energy2.png');
    expect(screen.getByTestId("energy-marker-3").getAttribute('href')).toContain('energy3.png');
    expect(screen.getByTestId("energy-marker-4").getAttribute('href')).toContain('energy4.png');
    expect(screen.getByTestId("energy-marker-5").getAttribute('href')).toContain('energy4.png');
  });
});
