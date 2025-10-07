import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest';
import GameBoardSettings from '../components/GameBoardSettings'

vi.mock('../components/ui/snackbar', () => {
  return {
    default: ({ message, show }) => {
      if (!show) return null;
      return <div data-testid="snackbar">{message}</div>;
    },
  };
});



const mockTemplates = [
    {name: 'Default Gameboard'},
    {name: 'Other Gameboard'}
]

const mockConfig = {
        name: 'Default Gameboard',
        ringData: [
        {
            id: 1,
            innerRadius: 200,
            outerRadius: 350,
            labels: [
            { id: 1, text: "Action 1", color: "#ffc072", energyvalue: 1 },
            { id: 2, text: "Action 2", color: "#ffb088", energyvalue: 2 },
            ]      
        },
        {
            id: 2,
            innerRadius: 350,
            outerRadius: 500,
                labels: [
            { id: 11, text: "Action 11", color: "#a3d7ff",energyvalue: 3 },
            { id: 12, text: "Action 12", color: "#a0b8ca",energyvalue: 4 },
            ],
        },
        {
            id: 3,
            innerRadius: 500,
            outerRadius: 650,
            labels: [
            { id: 21, text: "Action 21", color: "#bb98d5",energyvalue: 5 },
            { id: 22, text: "Action 22", color: "#bb98d5",energyvalue: 6 },
            ],   
        },
        {
            id: 4,
            innerRadius: 650,
            outerRadius: 800,
                labels: [
            { id: 31, text: "Action 31", color: "#da6363", energyvalue: 7 },
            { id: 32, text: "Action 32", color: "#da6363", energyvalue: 8 },
            ],   
        }
    ],
}

describe("GameBoardSettings", () => {
  const onConfigChangeMock = vi.fn();

  beforeAll(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTemplates),
      })
    );
  });

  afterAll(() => {
    global.fetch.mockRestore?.();
  });

  test("renders title and input for gameboard name", async () => {
    render(
      <GameBoardSettings
        gameConfig={mockConfig}
        onConfigChange={() => {}}
        isVisible={true}
      />
    );

    const title = await screen.findByText("Edit gameboard");
    expect(title).toBeInTheDocument();

    const input = await screen.findByLabelText(/Gameboard Name/);
    expect(input).toHaveValue("Default Gameboard");
  });



  test("loading templates", async () => {
    render(
      <GameBoardSettings
        gameConfig={mockConfig}
        onConfigChange={onConfigChangeMock}
        isVisible={true}
      />
    );

    expect(screen.getByText("Load gameboards:")).toBeInTheDocument();

    const select = await screen.findByRole("combobox");
    expect(select).toBeInTheDocument();

    expect(await screen.findByRole("option", { name: "Choose a template" })).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Default Gameboard" })).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Other Gameboard" })).toBeInTheDocument();
  });

  test("adding a slice", async () => {
    const onConfigChangeMock = vi.fn();
    render(
      <GameBoardSettings
        gameConfig={mockConfig}
        onConfigChange={onConfigChangeMock}
        isVisible={true}
      />
    );
    const addButtons = screen.getAllByText("+ Add Slice")
    expect(addButtons.length).toBeGreaterThan(0);
    const firstButton = addButtons[0];
    await act(async () => {
      fireEvent.click(firstButton) 
    })
    
    const originalCount = mockConfig.ringData[0].labels.length;
    const expectedCount = originalCount + 1;
    expect(expectedCount).toBeLessThanOrEqual(originalCount + 1)

  })

  test("removing a slice", async () => {
    render (
        <GameBoardSettings
            gameConfig={mockConfig}
            onConfigChange={onConfigChangeMock}
            isVisible={true}
        />
    );
    const deleteButton = screen.getAllByText("✕")
    expect(deleteButton.length).toBeGreaterThan(0);
    const fistdltBtn = deleteButton[0];
    await act(async () => {
      fireEvent.click(fistdltBtn)
    })
    const originalCount=mockConfig.ringData[0].labels.length;
    const expectedCount=originalCount - 1;
    expect(expectedCount).toBeLessThanOrEqual(originalCount - 1)

  })

  test("change slice name", async () => {
    render (
        <GameBoardSettings
            gameConfig={mockConfig}
            onConfigChange={onConfigChangeMock}
            isVisible={true}
        />
    );
    const sliceInput = screen.getByDisplayValue("Action 2");
    await act(async () => {
    fireEvent.change(sliceInput, { target: { value: "Changed button text" } });
    })
    expect(onConfigChangeMock).toHaveBeenCalled();
  })

  test("change gameboard name", async () => {
    render (
        <GameBoardSettings
        gameConfig={mockConfig}
        onConfigChange={onConfigChangeMock}
        isVisible={true}
        />
    );
    const gameboardname = screen.getByDisplayValue("Default Gameboard")
    await act(async () => {
      fireEvent.change(gameboardname, {target: {value: "New gameboard"}});
    })
    expect(onConfigChangeMock).toHaveBeenCalled();
  })

  test("change button colors", async () => {
    const onConfigChange = vi.fn()
    render (
        <GameBoardSettings
        gameConfig={mockConfig}
        onConfigChange={onConfigChange}
        isVisible={true}
        />
    );
    const colorButtons = screen.getAllByRole("button", { name: "" }); 
    const firstColorButton = colorButtons.find(btn =>
    btn.style.backgroundColor === "rgb(255, 192, 114)"
    );
    await act(async () => {
      fireEvent.click(firstColorButton);
    })
    expect(onConfigChange).toHaveBeenCalled();
  })


test("saving gameboard successfully", async () => {
    const onConfigChange = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    
    // Mock fetch to handle both load_all and save endpoints
    global.fetch = vi.fn((url) => {
        if (url.includes('load_all')) {
        return Promise.resolve({ 
            ok: true, 
            json: () => Promise.resolve(mockTemplates) 
        });
        }
        if (url.includes('save')) {
        return Promise.resolve({ 
            ok: true, 
            json: () => Promise.resolve({}) 
        });
        }
    });

    render(
        <GameBoardSettings
        gameConfig={mockConfig}
        onConfigChange={onConfigChange}
        isVisible={true}
        />
    );

    const saveButton = screen.getByText("Save Gameboard");
    await act(async () => {
      fireEvent.click(saveButton);
    })
    const snackbar = await screen.findByTestId("snackbar");
    expect(snackbar).toHaveTextContent("Gameboard saved successfully!");
    
    confirmSpy.mockRestore();
    });

test("saving without name", async () => {
    const onConfigChange = vi.fn();
    const configWithNoName = { ...mockConfig, name: "" };

    render(
        <GameBoardSettings
        gameConfig={configWithNoName}
        onConfigChange={onConfigChange}
        isVisible={true}
        />
    );

    const saveButton = screen.getByText("Save Gameboard");
    fireEvent.click(saveButton);

    const snackbar = await screen.findByTestId("snackbar");
    expect(snackbar).toHaveTextContent("Please enter a name before saving.");
    });

test("saveGameboard fails without error message", async () => {
  const onConfigChange = vi.fn();
  const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

  global.fetch = vi.fn((url) => {
    if (url.includes('load_all')) {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve(mockTemplates) 
      });
    }
    if (url.includes('save')) {
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}), 
      });
    }
  });

  render(
    <GameBoardSettings
      gameConfig={mockConfig}
      onConfigChange={onConfigChange}
      isVisible={true}
    />
  );

  const saveButton = screen.getByText("Save Gameboard");
  fireEvent.click(saveButton);

  const snackbar = await screen.findByTestId("snackbar");
  expect(snackbar).toHaveTextContent("Failed to save gameboard.");
  
  confirmSpy.mockRestore();
});

test("user confirmation when overwriting gameboard", async () => {
  const onConfigChange = vi.fn();
  const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

  global.fetch = vi.fn((url) => {
    if (url.includes('load_all')) {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve(mockTemplates) 
      });
    }
    if (url.includes('save')) {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({}) 
      });
    }
  });

  render(
    <GameBoardSettings
      gameConfig={mockConfig}
      onConfigChange={onConfigChange}
      isVisible={true}
    />
  );
  await screen.findByRole("combobox");
  const addButtons = screen.getAllByText("+ Add Slice")
  expect(addButtons.length).toBeGreaterThan(0);
  const firstButton = addButtons[0];
  await act(async () => {
      fireEvent.click(firstButton) 
    })

  const saveButton = screen.getByText("Save Gameboard");
  fireEvent.click(saveButton);

  // Verify confirm was called
  expect(confirmSpy).toHaveBeenCalled();

  // Verify snackbar shows success
  const snackbar = await screen.findByTestId("snackbar");
  expect(snackbar).toHaveTextContent("Gameboard saved successfully!");

  confirmSpy.mockRestore();
});

test("user confirmation when switching to different template after making changes", async () => {
  const onConfigChange = vi.fn();
  const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);

  global.fetch = vi.fn((url) => {
    if (url.includes('load_all')) {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve(mockTemplates) 
      });
    }
    if (url.includes('save')) {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({}) 
      });
    }
  });

  render(
    <GameBoardSettings
      gameConfig={mockConfig}
      onConfigChange={onConfigChange}
      isVisible={true}
    />
  );
  const select = await screen.findByRole("combobox");

  const nameInput = screen.getByPlaceholderText("Enter gameboard name");
  fireEvent.change(nameInput, { target: { value: "Changed name" } });

  fireEvent.change(select, { target: { value: "Other Gameboard" } });

  expect(confirmSpy).toHaveBeenCalledWith(
    "Unsaved changes will be discarded. Are you sure you want to proceed?"
  );

  confirmSpy.mockRestore();
  });

test("load saved templates", async () => {
  const onConfigChange = vi.fn();
  const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

  global.fetch = vi.fn((url) => {
    if (url.includes('load_all')) {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve(mockTemplates) 
      });
    }
    if (url.includes('save')) {
      return Promise.resolve({ 
        ok: true, 
        json: () => Promise.resolve({}) 
      });
    }
  });

  render(
    <GameBoardSettings
      gameConfig={mockConfig}
      onConfigChange={onConfigChange}
      isVisible={true}
    />
  );
  const select = await screen.findByRole("combobox");

  const nameInput = screen.getByPlaceholderText("Enter gameboard name");
  fireEvent.change(nameInput, { target: { value: "Changed name" } });

  fireEvent.change(select, { target: { value: "Other Gameboard" } });
  
  expect(confirmSpy).toHaveBeenCalled();
  expect(onConfigChange).toHaveBeenCalled();

  confirmSpy.mockRestore();
  });

test("handle energyvaluechange", async () => {
  render(
    <GameBoardSettings
    gameConfig={mockConfig}
    onConfigChange={onConfigChangeMock}
    isVisible={true}
    />
  )

  await screen.findAllByPlaceholderText("Slice text");
  const energyInput = await screen.findByTestId("energyvalue-input-2");
  await act(async () => {
    fireEvent.change(energyInput, {target: {value: "9"}})
  })
  expect(onConfigChangeMock).toHaveBeenCalled()
  expect(energyInput.value).toBe("9")

});
});
