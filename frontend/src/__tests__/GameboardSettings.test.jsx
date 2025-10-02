import { render, screen, fireEvent } from '@testing-library/react'
import GameBoardSettings from '../components/GameBoardSettings'

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
            { id: 1, text: "Action 1", color: "#ffc072" },
            { id: 2, text: "Action 2", color: "#ffb088" },
            { id: 3, text: "Action 3", color: "#ffc072" },
            ]      
        },
        {
            id: 2,
            innerRadius: 350,
            outerRadius: 500,
                labels: [
            { id: 11, text: "Action 11", color: "#a3d7ff" },
            { id: 12, text: "Action 12", color: "#a0b8ca" },
            { id: 13, text: "Action 13", color: "#a0b8ca" },
            ],
        },
        {
            id: 3,
            innerRadius: 500,
            outerRadius: 650,
            labels: [
            { id: 21, text: "Action 21", color: "#bb98d5" },
            { id: 22, text: "Action 22", color: "#bb98d5" },
            { id: 23, text: "Action 23", color: "#bb98d5" },
            ],   
        },
        {
            id: 4,
            innerRadius: 650,
            outerRadius: 800,
                labels: [
            { id: 31, text: "Action 31", color: "#da6363" },
            { id: 32, text: "Action 32", color: "#da6363" },
            { id: 33, text: "Action 33", color: "#ff8989" },
            ],   
        }
    ],
}

describe("GameBoardSettings", () => {
    test("renders title and input for gameboard name", () => {
        render(
            <GameBoardSettings
            gameConfig={mockConfig}
            onConfigChange={() => {}}
            isVisible={true}
            />
        )
        expect(screen.getByText("Edit gameboard")).toBeInTheDocument()
        expect(screen.getByLabelText(/Gameboard Name/)).toHaveValue("Default Gameboard")
    })

    const onConfigChangeMock = vi.fn();

    test("loading templates", async () => {
        const onConfigChangeMock = vi.fn();

        global.fetch = vi.fn(() =>
            Promise.resolve({
            json: () => Promise.resolve(mockTemplates),
            })
        );
        render(
            <GameBoardSettings
            gameConfig={mockConfig}
            onConfigChange={onConfigChangeMock}
            isVisible={true}
            />
        )
        expect(screen.getByText("Load gameboards:")).toBeInTheDocument();

        const select = await screen.findByRole("combobox");
        expect(select).toBeInTheDocument();

        expect(screen.getByRole("option", { name: "Choose a template" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Default Gameboard" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Other Gameboard" })).toBeInTheDocument();
        })

})

