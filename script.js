--// Serviços
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local CoreGui = game:GetService("CoreGui")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")
local UserInputService = game:GetService("UserInputService")

--// Remotes
local CreateRaidTeam = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("CreateRaidTeam")
local StartChallengeRaidMap = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("StartChallengeRaidMap")

--// Variáveis
local running = false
local userWorld = nil
local selectedRanks = {}

--// Função de notificação
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
ScreenGui.Name = "RaidScriptUI"
ScreenGui.ResetOnSpawn = false

local Frame = Instance.new("Frame")
Frame.Size = UDim2.new(0, 230, 0, 160)
Frame.Position = UDim2.new(0.35, 0, 0.35, 0)
Frame.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
Frame.Active = true
Frame.Draggable = true
Frame.Parent = ScreenGui
Frame.ClipsDescendants = true
Frame.BorderSizePixel = 0
Frame.BackgroundTransparency = 0.1

local UICorner = Instance.new("UICorner", Frame)
UICorner.CornerRadius = UDim.new(0, 8)

-- Título
local Title = Instance.new("TextLabel")
Title.Size = UDim2.new(1, 0, 0, 25)
Title.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
Title.Text = "⚔️ Raid Script"
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.Font = Enum.Font.SourceSansBold
Title.TextSize = 18
Title.Parent = Frame
Instance.new("UICorner", Title).CornerRadius = UDim.new(0, 8)

-- Mundo
local TextBox = Instance.new("TextBox")
TextBox.Size = UDim2.new(1, -20, 0, 30)
TextBox.Position = UDim2.new(0, 10, 0, 35)
TextBox.PlaceholderText = "Digite o mundo (1–9)"
TextBox.Text = ""
TextBox.BackgroundColor3 = Color3.fromRGB(55, 55, 55)
TextBox.TextColor3 = Color3.fromRGB(255, 255, 255)
TextBox.Parent = Frame
Instance.new("UICorner", TextBox).CornerRadius = UDim.new(0, 6)

-- Rank
local RankBox = Instance.new("TextBox")
RankBox.Size = UDim2.new(1, -20, 0, 30)
RankBox.Position = UDim2.new(0, 10, 0, 75)
RankBox.PlaceholderText = "Rank"
RankBox.Text = ""
RankBox.BackgroundColor3 = Color3.fromRGB(55, 55, 55)
RankBox.TextColor3 = Color3.fromRGB(255, 255, 255)
RankBox.Parent = Frame
Instance.new("UICorner", RankBox).CornerRadius = UDim.new(0, 6)

-- Botão
local Button = Instance.new("TextButton")
Button.Size = UDim2.new(1, -20, 0, 35)
Button.Position = UDim2.new(0, 10, 0, 115)
Button.Text = "Iniciar"
Button.BackgroundColor3 = Color3.fromRGB(90, 90, 90)
Button.TextColor3 = Color3.fromRGB(255, 255, 255)
Button.Font = Enum.Font.SourceSansBold
Button.TextSize = 18
Button.Parent = Frame
Instance.new("UICorner", Button).CornerRadius = UDim.new(0, 6)

-- Funções auxiliares
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
			root.CFrame = targetCFrame
			notify("Teleportado para dentro do EnchantChest!")
			return true
		end
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

-- Sequência
local function executeSequence()
	if not running then return end

	notify("Iniciando sequência no Mundo " .. userWorld .. "...")

	while running do
		for _, rank in ipairs(selectedRanks) do
			if not running then break end
			local args = {tonumber("9300" .. userWorld .. rank)}
			pcall(function()
				CreateRaidTeam:InvokeServer(unpack(args))
			end)
			notify("Rank " .. rank .. " enviado (" .. args[1] .. ")")
			task.wait(0.3)
		end

		if running then
			pcall(function()
				StartChallengeRaidMap:FireServer()
			end)
			notify("Challenge iniciado!")
			task.wait(2)
		end

		local exists, mapNumber = checkAirWallExists()
		if exists then
			notify("Model '1' encontrado no Map" .. mapNumber .. "! Procurando baú...")
			local chest = nil
			while running and not chest do
				chest = findEnchantChest()
				if chest then
					teleportToChestInside(chest)
				else
					task.wait(1)
				end
			end
			task.wait(3)
		else
			notify("Model '1' não encontrado, reiniciando...")
			task.wait(2)
		end
	end
end

-- Controle do botão
Button.MouseButton1Click:Connect(function()
	if running then
		running = false
		Button.Text = "Iniciar"
		notify("Script parado!")
	else
		userWorld = TextBox.Text
		local rankInput = RankBox.Text:lower()

		if userWorld == "" or tonumber(userWorld) == nil then
			notify("Digite um mundo válido (1–9)!")
			return
		end

		selectedRanks = {}

		if rankInput == "all" then
			for i = 1, 8 do
				table.insert(selectedRanks, i)
			end
		else
			for num in string.gmatch(rankInput, "%d+") do
				local n = tonumber(num)
				if n and n >= 1 and n <= 8 then
					table.insert(selectedRanks, n)
				end
			end
		end

		if #selectedRanks == 0 then
			notify("Nenhum rank válido selecionado!")
			return
		end

		running = true
		Button.Text = "Parar"
		notify("Script iniciado!")
		coroutine.wrap(executeSequence)()
	end
end)

notify("✅ Script carregado! Digite o mundo e os ranks (ou 'all') e clique em Iniciar.")
