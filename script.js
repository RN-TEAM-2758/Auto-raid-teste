--// Serviços
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local CoreGui = game:GetService("CoreGui")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")

--// Remotes
local CreateRaidTeam = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("CreateRaidTeam")
local StartChallengeRaidMap = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("StartChallengeRaidMap")

--// Variáveis
local running = false
local userWorld = nil
local selectedRanks = {}
local selectedWorlds = {}

--// Estados da GUI
local minimized = false
local worldDropdownOpen = false
local rankDropdownOpen = false

--// Lista de mundos (agora com "All")
local worldOptions = {
    "All",
    "Mundo 1",
    "Mundo 2",
    "Mundo 3", 
    "Mundo 4",
    "Mundo 5",
    "Mundo 6",
    "Mundo 7",
    "Mundo 8",
    "Mundo 9",
    "Mundo 10",
    "Mundo 11"
}

--// Opções de rank (removidos 4 e 7)
local rankOptions = {"All", "1", "2", "3", "5", "6", "8"}

--// FUNÇÕES DE NOTIFICAÇÃO E UTILITÁRIAS
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
					total += part.Position
					count += 1
				end
			end
			if count > 0 then
				targetCFrame = CFrame.new(total / count)
			end
		end

		if targetCFrame then
			targetCFrame = targetCFrame + Vector3.new(0, 3, 0)
			root.CFrame = targetCFrame
			return true
		end
	end
	return false
end

local function checkAirWallExists()
	local mapsFolder = Workspace:FindFirstChild("Maps")
	if not mapsFolder then return false, 0 end
	
	-- Verifica mapas de 0 a 11
	for i = 0, 11 do
		local mapPath = mapsFolder:FindFirstChild("Map" .. i)
		-- Verifica também o Map 103 (que é o Map 3 antigo)
		if i == 3 then
			mapPath = mapsFolder:FindFirstChild("Map103") or mapPath
		end
		
		if mapPath and mapPath:FindFirstChild("Map") and mapPath.Map:FindFirstChild("AirWall") then
			local airWall = mapPath.Map.AirWall
			if airWall:FindFirstChild("1") and airWall:FindFirstChild("1"):IsA("Model") then
				return true, i
			end
		end
	end
	return false, 0
end

--// FUNÇÃO PRINCIPAL DO SCRIPT
local function executeSequence()
	if not running then return end

	while running do
		-- Se "All" em mundos, preenche todos os mundos de 0 a 10 (evento)
		local worldsToUse = {}
		if #selectedWorlds == 0 then  -- Significa "All"
			for i = 0, 10 do
				table.insert(worldsToUse, tostring(i))
			end
		else
			worldsToUse = selectedWorlds
		end
		
		-- Se "All" em ranks, preenche todos os ranks disponíveis
		local ranksToUse = {}
		if #selectedRanks == 0 then  -- Significa "All"
			for i, option in ipairs(rankOptions) do
				if option ~= "All" then
					table.insert(ranksToUse, tonumber(option))
				end
			end
		else
			ranksToUse = selectedRanks
		end
		
		-- Executa para cada combinação de mundo e rank
		for _, world in ipairs(worldsToUse) do
			for _, rank in ipairs(ranksToUse) do
				if not running then break end
				local args = {tonumber("9300" .. world .. rank)}
				pcall(function()
					CreateRaidTeam:InvokeServer(unpack(args))
				end)
				wait(-99)
			end
			if not running then break end
		end

		if running then
			pcall(function()
				StartChallengeRaidMap:FireServer()
			end)
			task.wait(2)
		end

		local exists, mapNumber = checkAirWallExists()
		if exists then
			local chest = nil
			-- REMOVIDO: limite de tempo
			while running and not chest do
				chest = findEnchantChest()
				if not chest then
					task.wait(1)
				end
			end
			if chest then
				teleportToChestInside(chest)
				task.wait(3)
			else
				task.wait(2)
			end
		else
			task.wait(2)
		end
	end
end

--// CONFIGURAÇÃO DOS EFEITOS DOS BOTÕES
local function setupButtonEffects(button)
	local originalColor = button.BackgroundColor3
	
	button.MouseEnter:Connect(function()
		TweenService:Create(button, TweenInfo.new(0.2), {BackgroundColor3 = originalColor * 1.2}):Play()
	end)
	
	button.MouseLeave:Connect(function()
		TweenService:Create(button, TweenInfo.new(0.2), {BackgroundColor3 = originalColor}):Play()
	end)
	
	-- Efeito de clique
	button.MouseButton1Down:Connect(function()
		TweenService:Create(button, TweenInfo.new(0.1), {BackgroundColor3 = originalColor * 0.8}):Play()
	end)
	
	button.MouseButton1Up:Connect(function()
		TweenService:Create(button, TweenInfo.new(0.1), {BackgroundColor3 = originalColor * 1.2}):Play()
	end)
end

--// DESTROY OLD PANEL
local existing = CoreGui:FindFirstChild("AutoRaidPanel")
if existing then existing:Destroy() end

--// Main GUI
local screenGui = Instance.new("ScreenGui", CoreGui)
screenGui.Name = "AutoRaidPanel"
screenGui.ResetOnSpawn = false

local mainFrame = Instance.new("Frame", screenGui)
mainFrame.Size = UDim2.new(0, 320, 0, 400)
mainFrame.Position = UDim2.new(0.5, -160, 0.5, -200)
mainFrame.BackgroundColor3 = Color3.fromRGB(20,20,25)
mainFrame.BorderSizePixel = 0
mainFrame.ClipsDescendants = true
mainFrame.AnchorPoint = Vector2.new(0,0)

local round = Instance.new("UICorner", mainFrame)
round.CornerRadius = UDim.new(0,12)

-- Header
local header = Instance.new("Frame", mainFrame)
header.Size = UDim2.new(1,0,0,50)
header.Position = UDim2.new(0,0,0,0)
header.BackgroundColor3 = Color3.fromRGB(30,30,40)
header.BorderSizePixel = 0

local headerCorner = Instance.new("UICorner", header)
headerCorner.CornerRadius = UDim.new(0,12)

local title = Instance.new("TextLabel", header)
title.Size = UDim2.new(1, -100, 1, 0)
title.Position = UDim2.new(0,12,0,0)
title.BackgroundTransparency = 1
title.Text = "🔥 Auto Raid 🔥"
title.TextXAlignment = Enum.TextXAlignment.Left
title.TextYAlignment = Enum.TextYAlignment.Center
title.TextSize = 18
title.Font = Enum.Font.GothamBold
title.TextColor3 = Color3.fromRGB(240,240,245)

-- Minimize & Close
local btnClose = Instance.new("TextButton", header)
btnClose.Size = UDim2.new(0,36,0,28)
btnClose.Position = UDim2.new(1,-44,0,11)
btnClose.Text = "X"
btnClose.Font = Enum.Font.GothamBold
btnClose.TextSize = 18
btnClose.BackgroundColor3 = Color3.fromRGB(170,60,60)
btnClose.TextColor3 = Color3.fromRGB(255,255,255)
btnClose.BorderSizePixel = 0
local closeCorner = Instance.new("UICorner", btnClose)
closeCorner.CornerRadius = UDim.new(0,6)

local btnMin = Instance.new("TextButton", header)
btnMin.Size = UDim2.new(0,36,0,28)
btnMin.Position = UDim2.new(1,-88,0,11)
btnMin.Text = "–"
btnMin.Font = Enum.Font.GothamBold
btnMin.TextSize = 20
btnMin.BackgroundColor3 = Color3.fromRGB(90,90,120)
btnMin.TextColor3 = Color3.fromRGB(255,255,255)
btnMin.BorderSizePixel = 0
local minCorner = Instance.new("UICorner", btnMin)
minCorner.CornerRadius = UDim.new(0,6)

-- Content Frame
local contentFrame = Instance.new("Frame", mainFrame)
contentFrame.Size = UDim2.new(1,0,1,-50)
contentFrame.Position = UDim2.new(0,0,0,50)
contentFrame.BackgroundTransparency = 1

-- Button to open world selection
local btnWorld = Instance.new("TextButton", contentFrame)
btnWorld.Size = UDim2.new(1, -24, 0, 50)
btnWorld.Position = UDim2.new(0,12,0,12)
btnWorld.Text = "Escolher Mundo"
btnWorld.Font = Enum.Font.GothamBold
btnWorld.TextSize = 16
btnWorld.TextColor3 = Color3.fromRGB(255,255,255)
btnWorld.BackgroundColor3 = Color3.fromRGB(45,45,65)
btnWorld.BorderSizePixel = 0
local worldBtnCorner = Instance.new("UICorner", btnWorld)
worldBtnCorner.CornerRadius = UDim.new(0,10)

-- Button to open rank selection
local btnRank = Instance.new("TextButton", contentFrame)
btnRank.Size = UDim2.new(1, -24, 0, 50)
btnRank.Position = UDim2.new(0,12,0,74)
btnRank.Text = "Escolher Rank"
btnRank.Font = Enum.Font.GothamBold
btnRank.TextSize = 16
btnRank.TextColor3 = Color3.fromRGB(255,255,255)
btnRank.BackgroundColor3 = Color3.fromRGB(45,45,65)
btnRank.BorderSizePixel = 0
local rankBtnCorner = Instance.new("UICorner", btnRank)
rankBtnCorner.CornerRadius = UDim.new(0,10)

-- Start/Stop Button
local btnStart = Instance.new("TextButton", contentFrame)
btnStart.Size = UDim2.new(1, -24, 0, 50)
btnStart.Position = UDim2.new(0,12,0,136)
btnStart.Text = "INICIAR"
btnStart.Font = Enum.Font.GothamBold
btnStart.TextSize = 16
btnStart.TextColor3 = Color3.fromRGB(255,255,255)
btnStart.BackgroundColor3 = Color3.fromRGB(60, 120, 60)
btnStart.BorderSizePixel = 0
local startBtnCorner = Instance.new("UICorner", btnStart)
startBtnCorner.CornerRadius = UDim.new(0,10)

-- WORLD SCROLL FRAME
local worldPanel = Instance.new("Frame", contentFrame)
worldPanel.Size = UDim2.new(1,0,1,0)
worldPanel.Position = UDim2.new(1,0,0,0) -- offscreen
worldPanel.BackgroundColor3 = Color3.fromRGB(20,20,25) -- Fundo para não ver através
worldPanel.BorderSizePixel = 0

local worldPanelCorner = Instance.new("UICorner", worldPanel)
worldPanelCorner.CornerRadius = UDim.new(0,12)

local scrollFrame = Instance.new("ScrollingFrame", worldPanel)
scrollFrame.Size = UDim2.new(1, -24, 1, 0) -- Ocupa toda altura
scrollFrame.Position = UDim2.new(0,12,0,0)
scrollFrame.BackgroundTransparency = 1
scrollFrame.BorderSizePixel = 0
scrollFrame.ScrollBarThickness = 0 -- Barra de rolagem removida
scrollFrame.CanvasSize = UDim2.new(0,0,0,(#worldOptions * 48) + ((#worldOptions - 1) * 6))

local uiList = Instance.new("UIListLayout", scrollFrame)
uiList.SortOrder = Enum.SortOrder.LayoutOrder
uiList.Padding = UDim.new(0,6)

for i,name in ipairs(worldOptions) do
    local b = Instance.new("TextButton", scrollFrame)
    b.Size = UDim2.new(1,0,0,42)
    b.Text = name
    b.Font = Enum.Font.Gotham
    b.TextSize = 16
    b.TextColor3 = Color3.fromRGB(240,240,245)
    b.BackgroundColor3 = Color3.fromRGB(40,40,55)
    b.BorderSizePixel = 0
    local c = Instance.new("UICorner", b)
    c.CornerRadius = UDim.new(0,8)
    
    -- Aplicar efeitos ao botão do mundo
    setupButtonEffects(b)
    
    b.MouseButton1Click:Connect(function()
        if name == "All" then
            selectedWorlds = {}
            btnWorld.Text = "All Mundos"
            notify("Selecionado: Todos os Mundos")
        else
            -- CORREÇÃO: O número para o evento é sempre 1 a menos que o mostrado
            -- Mundo 1 no menu = 0 no evento, Mundo 2 no menu = 1 no evento, etc.
            local eventWorldNum = i - 2  -- i=1 (All), i=2 (Mundo 1) = 0, i=3 (Mundo 2) = 1, etc.
            
            selectedWorlds = {tostring(eventWorldNum)}
            btnWorld.Text = name -- atualiza botão com nome bonito
            notify("Mundo selecionado: " .. name .. " (Evento: " .. eventWorldNum .. ")")
        end
        TweenService:Create(worldPanel, TweenInfo.new(0.25, Enum.EasingStyle.Quart), {Position = UDim2.new(1,0,0,0)}):Play()
    end)
end

-- RANK SCROLL FRAME
local rankPanel = Instance.new("Frame", contentFrame)
rankPanel.Size = UDim2.new(1,0,1,0)
rankPanel.Position = UDim2.new(1,0,0,0) -- offscreen
rankPanel.BackgroundColor3 = Color3.fromRGB(20,20,25) -- Fundo para não ver através
rankPanel.BorderSizePixel = 0

local rankPanelCorner = Instance.new("UICorner", rankPanel)
rankPanelCorner.CornerRadius = UDim.new(0,12)

local rankScrollFrame = Instance.new("ScrollingFrame", rankPanel)
rankScrollFrame.Size = UDim2.new(1, -24, 1, 0) -- Ocupa toda altura
rankScrollFrame.Position = UDim2.new(0,12,0,0)
rankScrollFrame.BackgroundTransparency = 1
rankScrollFrame.BorderSizePixel = 0
rankScrollFrame.ScrollBarThickness = 0 -- Barra de rolagem removida
rankScrollFrame.CanvasSize = UDim2.new(0,0,0,(#rankOptions * 48) + ((#rankOptions - 1) * 6))

local rankUiList = Instance.new("UIListLayout", rankScrollFrame)
rankUiList.SortOrder = Enum.SortOrder.LayoutOrder
rankUiList.Padding = UDim.new(0,6)

for i,option in ipairs(rankOptions) do
    local b = Instance.new("TextButton", rankScrollFrame)
    b.Size = UDim2.new(1,0,0,42)
    b.Text = option
    b.Font = Enum.Font.Gotham
    b.TextSize = 16
    b.TextColor3 = Color3.fromRGB(240,240,245)
    b.BackgroundColor3 = Color3.fromRGB(40,40,55)
    b.BorderSizePixel = 0
    local c = Instance.new("UICorner", b)
    c.CornerRadius = UDim.new(0,8)
    
    -- Aplicar efeitos ao botão do rank
    setupButtonEffects(b)
    
    b.MouseButton1Click:Connect(function()
        btnRank.Text = option
        if option == "All" then
            selectedRanks = {}
            notify("Selecionado: Todos os Ranks")
        else
            local rankNum = tonumber(option)
            selectedRanks = {rankNum}
            notify("Rank selecionado: " .. option)
        end
        TweenService:Create(rankPanel, TweenInfo.new(0.25, Enum.EasingStyle.Quart), {Position = UDim2.new(1,0,0,0)}):Play()
    end)
end

-- Aplicar efeitos aos botões principais
setupButtonEffects(btnWorld)
setupButtonEffects(btnRank)
setupButtonEffects(btnStart)
setupButtonEffects(btnMin)
setupButtonEffects(btnClose)

-- Show world panel
btnWorld.MouseButton1Click:Connect(function()
    TweenService:Create(worldPanel, TweenInfo.new(0.25, Enum.EasingStyle.Quart), {Position = UDim2.new(0,0,0,0)}):Play()
end)

-- Show rank panel
btnRank.MouseButton1Click:Connect(function()
    TweenService:Create(rankPanel, TweenInfo.new(0.25, Enum.EasingStyle.Quart), {Position = UDim2.new(0,0,0,0)}):Play()
end)

-- Minimize / expand
btnMin.MouseButton1Click:Connect(function()
    minimized = not minimized
    if minimized then
        TweenService:Create(mainFrame, TweenInfo.new(0.25), {Size = UDim2.new(0, 200,0,50)}):Play()
        contentFrame.Visible = false
    else
        contentFrame.Visible = true
        TweenService:Create(mainFrame, TweenInfo.new(0.25), {Size = UDim2.new(0,320,0,400)}):Play()
    end
end)

-- Close
btnClose.MouseButton1Click:Connect(function()
    screenGui:Destroy()
    notify("Auto Raid fechado")
end)

-- Start/Stop functionality
btnStart.MouseButton1Click:Connect(function()
	if running then
		running = false
		btnStart.Text = "INICIAR"
		btnStart.BackgroundColor3 = Color3.fromRGB(60, 120, 60)
		notify("Auto Raid parado")
	else
		if btnWorld.Text == "Escolher Mundo" then
			notify("Selecione um mundo primeiro!")
			return
		end
		if btnRank.Text == "Escolher Rank" then
			notify("Selecione um rank primeiro!")
			return
		end

		running = true
		btnStart.Text = "PARAR"
		btnStart.BackgroundColor3 = Color3.fromRGB(180, 60, 60)  -- Vermelho quando ativo
		
		local worldText = btnWorld.Text
		local rankText = btnRank.Text
		notify("Auto Raid iniciado! " .. worldText .. " | " .. rankText)
		coroutine.wrap(executeSequence)()
	end
end)

-- Drag anywhere no menu
local dragging = false
local dragStart = nil
local startPos = nil

local function startDrag(input)
    dragging = true
    dragStart = input.Position
    startPos = mainFrame.Position
    input.Changed:Connect(function()
        if input.UserInputState == Enum.UserInputState.End then
            dragging = false
        end
    end)
end

local function doDrag(input)
    if not dragging then return end
    local delta = input.Position - dragStart
    mainFrame.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X,
                                   startPos.Y.Scale, startPos.Y.Offset + delta.Y)
end

mainFrame.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        startDrag(input)
    end
end)
mainFrame.InputChanged:Connect(doDrag)

-- Fechar painéis ao clicar fora
UserInputService.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        local mousePos = UserInputService:GetMouseLocation()
        local worldPanelPos = worldPanel.AbsolutePosition
        local worldPanelSize = worldPanel.AbsoluteSize
        local rankPanelPos = rankPanel.AbsolutePosition
        local rankPanelSize = rankPanel.AbsoluteSize
        
        -- Verificar se clicou fora do painel de mundos
        if worldPanel.Position == UDim2.new(0,0,0,0) then
            if not (mousePos.X >= worldPanelPos.X and mousePos.X <= worldPanelPos.X + worldPanelSize.X and
                   mousePos.Y >= worldPanelPos.Y and mousePos.Y <= worldPanelPos.Y + worldPanelSize.Y) then
                TweenService:Create(worldPanel, TweenInfo.new(0.25, Enum.EasingStyle.Quart), {Position = UDim2.new(1,0,0,0)}):Play()
            end
        end
        
        -- Verificar se clicou fora do painel de ranks
        if rankPanel.Position == UDim2.new(0,0,0,0) then
            if not (mousePos.X >= rankPanelPos.X and mousePos.X <= rankPanelPos.X + rankPanelSize.X and
                   mousePos.Y >= rankPanelPos.Y and mousePos.Y <= rankPanelPos.Y + rankPanelSize.Y) then
                TweenService:Create(rankPanel, TweenInfo.new(0.25, Enum.EasingStyle.Quart), {Position = UDim2.new(1,0,0,0)}):Play()
            end
        end
    end
end)

print("Auto Raid GUI completa carregada!")
