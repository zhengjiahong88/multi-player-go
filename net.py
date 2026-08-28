import sys
import torch
from torch import nn

SIZE = int(sys.argv[1])
PLAYER_COUNT = int(sys.argv[2])
ACTION_SIZE = SIZE * SIZE + 1


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
        return self.policy(x), torch.softmax(self.value(x), dim=1)


net = Net()
net.eval()

for line in sys.stdin:
    data = list(map(float, line.split()))
    state = torch.tensor(data, dtype=torch.float32).reshape(1, PLAYER_COUNT, SIZE, SIZE)
    with torch.no_grad(): policy, value = net(state)
    print(*policy[0].tolist(), flush=True)
    print(*value[0].tolist(), flush=True)
