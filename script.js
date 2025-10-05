--// Serviços
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local CoreGui = game:GetService("CoreGui")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local CreateRaidTeam = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("CreateRaidTeam")
local StartChallengeRaidMap = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("StartChallengeRaidMap")

--// Variáveis
local running = false
local userWorld = nil

--// Notificação
local function notify(msg)
    pcall(function()
        game.StarterGui:SetCore("SendNotification", {
            Title = "Raid Script",
            Text = msg,
            Duration = 3
        })
    end)
    print("[RaidScript] " .. msg)
end

--// Criar GUI
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Parent = CoreGui

local Frame = Instance.new("Frame")
Frame.Size = UDim2.new(0, 220, 0, 120)
Frame.Position = UDim2.new(0.35, 0, 0.35, 0)
Frame.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
Frame.Parent = ScreenGui

local TextBox = Instance.new("TextBox")
TextBox.Size = UDim2.new(1, -20, 0, 30)
TextBox.Position = UDim2.new(0, 10, 0, 10)
TextBox.PlaceholderText = "Digite o mundo (1-9)"
TextBox.Text = ""
TextBox.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
TextBox.TextColor3 = Color3.fromRGB(255, 255, 255)
TextBox.Parent = Frame

local Button = Instance.new("TextButton")
Button.Size = UDim2.new(1, -20, 0, 40)
Button.Position = UDim2.new(0, 10, 0, 50)
Button.Text = "Iniciar"
Button.BackgroundColor3 = Color3.fromRGB(80, 80, 80)
Button.TextColor3 = Color3.fromRGB(255, 255, 255)
Button.Parent = Frame

--// Funções auxiliares
local function findEnchantChest()
    return Workspace:FindFirstChild("EnchantChest")
end

local function teleportToChestInside(chest)
    if chest and chest:IsA("Model") then
        local char = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
        local root = char:WaitForChild("HumanoidRootPart")
        local targetCFrame
        if chest.PrimaryPart then
            targetCFrame = chest.PrimaryPart.CFrame
        else
            local total = Vector3.new()
            local count = 0
            for _, part in pairs(chest:GetDescendants()) do
                if part:IsA("BasePart") then
                    total = total + part.Position
                    count = count + 1
                end
            end
            if count > 0 then
                targetCFrame = CFrame.new(total / count)
            else
                targetCFrame = chest:GetModelCFrame()
            end
        end
        root.CFrame = targetCFrame
        notify("Teleportado para dentro do EnchantChest!")
        return true
    end
    return false
end

local function checkAirWallExists()
    for i = 0, 9 do
        local mapPath = Workspace.Maps:FindFirstChild("Map" .. i)
        if mapPath and mapPath:FindFirstChild("Map") and mapPath.Map:FindFirstChild("AirWall") then
            local airWall = mapPath.Map.AirWall
            if airWall:FindFirstChild("1") and airWall:FindFirstChild("1"):IsA("Model") then
                return true, i
            end
        end
    end
    return false, 0
end

--// Sequência principal
local function executeSequence()
    if not running then return end

    notify("Iniciando sequência no Mundo " .. userWorld .. "...")

    while running do
        -- Envia ranks 1–8
        for rank = 1, 8 do
            if not running then break end
            local args = {tonumber("9300" .. userWorld .. rank)}
            pcall(function()
                CreateRaidTeam:InvokeServer(unpack(args))
            end)
            notify("Enviado: " .. args[1])
            task.wait(0.2)
        end

        -- Ativa o Challenge
        if running then
            pcall(function()
                StartChallengeRaidMap:FireServer()
            end)
            notify("Challenge iniciado!")
            task.wait(2)
        end

        -- Checa se o Model '1' apareceu
        local exists, mapNumber = checkAirWallExists()
        if exists then
            notify("Model '1' encontrado no Map" .. mapNumber .. "! Teleportando para o baú...")
            local chest = nil
            while running and not chest do
                chest = findEnchantChest()
                if chest then
                    teleportToChestInside(chest)
                else
                    task.wait(1)
                end
            end
            task.wait(3) -- espera antes de reiniciar
        else
            notify("Model '1' não encontrado, reiniciando sequência 1–8...")
            task.wait(2) -- pequena pausa antes de reiniciar
        end
    end
end

--// Controle do botão
Button.MouseButton1Click:Connect(function()
    if running then
        running = false
        notify("Script parado!")
        Button.Text = "Iniciar"
    else
        userWorld = TextBox.Text
        if userWorld == "" or tonumber(userWorld) == nil then
            notify("Digite um número de mundo válido (0-9)!")
            return
        end
        running = true
        notify("Script iniciado!")
        Button.Text = "Parar"
        coroutine.wrap(executeSequence)()
    end
end)

notify("Script carregado! Escolha o mundo (0-9) e clique em Iniciar.")