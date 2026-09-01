import sys
from pathlib import Path
import torch
from torch import nn

SIZE = int(sys.argv[1])
PLAYER_COUNT = int(sys.argv[2])
POINTS = SIZE * SIZE
ACTION_SIZE = POINTS + 1
MODEL_PATH = Path(__file__).with_name("model.pt")

def get_list():
    return list(map(float, sys.stdin.readline().split()))

def tensor(list):
    return torch.tensor(list, dtype=torch.float32)


class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.body = nn.Sequential(
            nn.Conv2d(PLAYER_COUNT, 32, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 32, 3, padding=1),
            nn.ReLU()
        )
        self.policy = nn.Linear(32 * SIZE * SIZE, ACTION_SIZE)
        self.value = nn.Linear(32 * SIZE * SIZE, PLAYER_COUNT)

    def forward(self, x):
        x = self.body(x).flatten(1)
        return self.policy(x), self.value(x)

    def evaluate(self, data: list[float]):
        state = tensor(data).reshape(1, PLAYER_COUNT, SIZE, SIZE)
        self.eval()
        with torch.no_grad():
            policy, value = self(state)
            value = torch.softmax(value, dim=1)
        print(*policy[0].tolist(), flush=True)
        print(*value[0].tolist(), flush=True)

    def learn(self, count: int):
        states = []
        pi = []
        for _ in range(count):
            states.append(get_list())
            pi.append(get_list())

        states = tensor(states).reshape(count, PLAYER_COUNT, SIZE, SIZE)
        pi = tensor(pi)
        z = tensor(get_list()).repeat(count, 1)
        self.train()
        policy_logits, value_logits = self(states)
        policy_loss = -(pi * torch.log_softmax(policy_logits, dim=1)).sum(dim=1).mean()
        value_loss = -(z * torch.log_softmax(value_logits, dim=1)).sum(dim=1).mean()
        loss = policy_loss + value_loss
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        torch.save({"model": net.state_dict(), "optimizer": optimizer.state_dict()}, MODEL_PATH)
        print(policy_loss.item(), value_loss.item(), loss.item(), file=sys.stderr, flush=True)


net = Net()
optimizer = torch.optim.Adam(net.parameters(), lr=0.001)
if MODEL_PATH.exists():
    checkpoint = torch.load(MODEL_PATH)
    net.load_state_dict(checkpoint["model"])
    optimizer.load_state_dict(checkpoint["optimizer"])


for line in sys.stdin:
    line = line.strip()
    try: net.learn(int(line))
    except ValueError: net.evaluate(list(map(float, line.split())))
