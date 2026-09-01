import java.io.IOException;

class Main {
    static int PLAYER_COUNT = 3, SIZE = 9, POINTS = SIZE * SIZE, ACTION_SIZE = POINTS + 1;
    static PythonNet NET;

    void main() throws IOException {
        NET = new PythonNet("C:\\Users\\User\\anaconda3\\envs\\mcts\\python.exe", "net.py");
        for (int i = 0; i < 1000; ++i) new Node();
    }
}