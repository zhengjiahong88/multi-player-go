import java.io.IOException;
import java.util.*;

class Node implements Iterable<Node> {
    static final int SIMULATIONS = 100;

    static int moveIndex(Pos pos) {
        if (pos == null) return Main.POINTS;
        return pos.toInt();
    }

    final Node[] children = new Node[Main.ACTION_SIZE];
    final Node parent;
    final Board board;
    final double[] valueSum = new double[Main.PLAYER_COUNT];
    double prior, searchPolicy;
    int passes, visits;

    Node(Node parent, double[] probabilities, Pos pos) {
        passes = parent.passes;
        if (pos == null) {
            this.board = parent.board.pass();
            ++passes;
        }
        else {
            board = parent.board.move(pos);
            passes = 0;
        }
        this.parent = parent;
        int index = moveIndex(pos);
        prior = probabilities[index];
        parent.children[index] = this;
    }

    Node() throws IOException {
        board = new Board(1);
        parent = null;
        Node node = this;
        for (; node.gameContinue(); node.board.print()) {
            for (int i = 0; i < SIMULATIONS; ++i) {
                Node leaf = node.selection();
                leaf.backPropagation(leaf.expansion());
            }
            node = node.selectMove();
        }
        node.createTrainingData();
    }

    double ucb() {
        return (visits == 0 ? 0 : valueSum[parent.board.player() - 1] / visits) + 1.4 * prior * Math.sqrt(parent.visits) / (1 + visits);
    }

    boolean gameContinue() {
        return passes < Main.PLAYER_COUNT;
    }

    Node selection() {
        for (Node node = this; true;) {
            Node max = null;
            double maxValue = Double.NEGATIVE_INFINITY;
            for (Node child : node) {
                double value = child.ucb();
                if (value > maxValue) {
                    maxValue = value;
                    max = child;
                }
            }
            if (max == null) return node;
            node = max;
        }
    }

    double[] expansion() throws IOException {
        if (!gameContinue()) return board.getFinalResult();
        NetResult result = Main.NET.evaluate(board.getState());
        double[] mask = new double[Main.ACTION_SIZE];
        Arrays.fill(mask, Double.NEGATIVE_INFINITY);
        var moves = board.legalMoves(parent);
        for (Pos move : moves) {
            int index = moveIndex(move);
            mask[index] = result.policy()[index];
        }
        double max = Arrays.stream(mask).max().orElse(0), sum = 0;
        var probabilities = new double[Main.ACTION_SIZE];
        for (int i = 0; i < Main.ACTION_SIZE; ++i) {
            probabilities[i] = Math.exp(mask[i] - max);
            sum += probabilities[i];
        }
        for (int i = 0; i < Main.ACTION_SIZE; ++i) probabilities[i] /= sum;
        for (Pos move : moves) new Node(this, probabilities, move);
        return result.value();
    }

    void backPropagation(double[] value) {
        for (Node node = this; node != null; node = node.parent) {
            for (int i = 0; i < Main.PLAYER_COUNT; ++i) node.valueSum[i] += value[i];
            ++node.visits;
        }
    }

    Node selectMove() {
        int total = 0;
        for (Node child : this) total += child.visits;
        for (Node child : this) child.searchPolicy = (double) child.visits / total;
        double r = Math.random(), sum = 0;
        for (Node child : this) {
            sum += child.searchPolicy;
            if (r < sum) return child;
        }
        return null;
    }

    void createTrainingData() throws IOException {
        var z = board.getFinalResult();
        var trainingData = new ArrayList<TrainingData>();
        for (Node node = parent; node != null; node = node.parent) {
            double[] pi = new double[Main.ACTION_SIZE];
            for (int i = 0; i < Main.ACTION_SIZE; ++i) if (node.children[i] != null) pi[i] = node.children[i].searchPolicy;
            trainingData.add(new TrainingData(node.board.getState(), pi));
        }
        Main.NET.learn(trainingData.reversed().toArray(TrainingData[]::new), z);
    }

    @Override
    public Iterator<Node> iterator() {
        var result = new ArrayList<Node>();
        for (Node child : children) if (child != null) result.add(child);
        return result.iterator();
    }
}
