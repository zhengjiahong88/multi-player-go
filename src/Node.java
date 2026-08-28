import java.io.IOException;
import java.util.*;

class Node implements Iterable<Node> {
    static final int SIMULATIONS = 10000;

    static int moveIndex(Pos pos) {
        if (pos == null) return Main.POINTS;
        return pos.toInt();
    }

    final Node[] children = new Node[Main.ACTION_SIZE];
    final Node parent;
    final double[] valueSum = new double[Main.PLAYER_COUNT];
    final Board board;
    double prior, pi;
    int passes, visits;

    Node() throws IOException {
        board = new Board(1);
        parent = null;
        Node node = this;
        for (; node.gameContinue(); node.board.print()) {
            for (int i = 0; i < SIMULATIONS; ++i) {
                Node leaf = node.selection();
                leaf.backPropagation(leaf.expansion());
            }
            int total = 0;
            for (Node child : node) total += child.visits;
            for (Node child : node) child.pi = (double) child.visits / total;
            double r = Math.random(), sum = 0;
            for (Node child : node) {
                sum += child.pi;
                if (r < sum) {
                    node = child;
                    break;
                }
            }
        }
        var trainingData = new ArrayList<TrainingData>();
        for (node = node.parent; node != null; node = node.parent) {
            double[] pi = new double[Main.ACTION_SIZE];
            for (int i = 0; i < Main.ACTION_SIZE; ++i) if (node.children[i] != null) pi[i] = node.children[i].pi;

            trainingData.add(new TrainingData(node.board.getState(), pi, node.board.getZ()));
        }
        Collections.reverse(trainingData);
        System.out.println("資料數量 =" + trainingData.size());
    }

    Node(Node parent, Pos pos) {
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
        if (!gameContinue()) return board.getZ();
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
        for (Pos move : moves) {
            Node child = new Node(this, move);
            int index = moveIndex(move);
            child.prior = probabilities[index];
            children[index] = child;
        }
        return result.value();
    }

    void backPropagation(double[] value) {
        for (Node node = this; node != null; node = node.parent) {
            for (int i = 0; i < Main.PLAYER_COUNT; ++i) node.valueSum[i] += value[i];
            ++node.visits;
        }
    }

    @Override
    public Iterator<Node> iterator() {
        var result = new ArrayList<Node>();
        for (Node child : children) if (child != null) result.add(child);
        return result.iterator();
    }
}
