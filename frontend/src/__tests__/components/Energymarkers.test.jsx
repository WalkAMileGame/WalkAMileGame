import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EnergyMarkers from "../../components/EnergyMarkers";

describe("EnergyMarkers", () => {
  const mockGameConfig = {
    ringData: [
      {
        id: 1,
        innerRadius: 200,
        outerRadius: 350,
        labels: [
          { id: 1, text: "Action 1", color: "#ffc072" },
          { id: 2, text: "Action 2", color: "#ffb088" },
        ]
      }
    ]
  };

  const mockRotations = { 1: 0 };
  const centerX = 800;
  const centerY = 800;

  it("renders markers for active marker IDs", () => {
    const mockActiveMarkers = new Set([1, 2]);
    
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
    const mockActiveMarkers = new Set([1]); // Only marker 1 is active
    
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
});
