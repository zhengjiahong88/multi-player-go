import java.io.IOException;

class Main {
    static int PLAYER_COUNT = 2, SIZE = 4, POINTS = SIZE * SIZE, ACTION_SIZE = POINTS + 1;
    static PythonNet NET;

    void main() throws IOException {
        NET = new PythonNet("C:\\Users\\User\\anaconda3\\envs\\mcts\\python.exe", "net.py");
        new Node();
    }
}