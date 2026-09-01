import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;

record Board(int[][] board, int player) {
    Board(int player) {
        this(new int[Main.SIZE][Main.SIZE], player);
    }

    private Board(Board parent) {
        this(parent.player == Main.PLAYER_COUNT ? 1 : parent.player + 1);
        for (int i = 0; i < Main.SIZE; ++i) board[i] = parent.board[i].clone();
    }

    private int get(Pos pos) {
        return board[pos.row()][pos.col()];
    }

    private void set(Pos pos, int value) {
        board[pos.row()][pos.col()] = value;
    }

    double[] getFinalResult() {
        var scores = new int[Main.PLAYER_COUNT];
        var checkedEmpty = new HashSet<Pos>();
        for (Pos pos : Pos.ALL_POS) {
            int player = get(pos);
            if (player != 0) ++scores[player - 1];
            else if (!checkedEmpty.contains(pos)) {
                var group = new HashSet<Pos>();
                var colors = new HashSet<Integer>();
                pos.search(group, n -> {
                    if (get(n) != 0) {
                        colors.add((get(n)));
                        return false;
                    }
                    return !group.contains(n);
                });
                checkedEmpty.addAll(group);
                if (colors.size() == 1) scores[colors.iterator().next() - 1] += group.size();
            }
        }
        int sum = Arrays.stream(scores).sum();
        var finalResult = new double[Main.PLAYER_COUNT];
        for (int i = 0; i < Main.PLAYER_COUNT; ++i) finalResult[i] = (double) scores[i] / sum;
        return finalResult;
    }

    double[][][] getState() {
        var state = new double[Main.PLAYER_COUNT][Main.SIZE][Main.SIZE];
        for (Pos pos : Pos.ALL_POS) if (get(pos) != 0) state[get(pos) - 1][pos.row()][pos.col()] = 1;
        return state;
    }

    Board move(Pos pos) {
        Board board = pass();
        board.set(pos, player);
        for (Pos n : pos) {
            if (board.get(n) == 0 || board.get(n) == player) continue;
            Group group = board.getGroup(n);
            if (group.isEaten()) for (Pos p : group) board.set(p, 0);
        }
        return board;
    }

    Board pass() {
        return new Board(this);
    }

    ArrayList<Pos> legalMoves(Node parent) {
        var moves = new ArrayList<Pos>();
        for (Pos pos : Pos.ALL_POS) if (get(pos) == 0) {
            Board child = move(pos);
            Group group = child.getGroup(pos);
            if ((parent == null || !child.isEqual(parent.board)) && !group.isEaten()) moves.add(pos);
        }
        moves.add(null);
        return moves;
    }

    void print() {
        for (var row : board) {
            for (int value : row) System.out.print(value + " ");
            System.out.println();
        }
    }

    private Group getGroup(Pos pos) {
        int color = get(pos);
        Group group = new Group();
        pos.search(group.pieces(), n -> {
            if (get(n) == 0) {
                group.liberties().add(n);
                return false;
            }
            return get(n) == color;
        });
        return group;
    }

    private boolean isEqual(Board other) {
        return Arrays.deepEquals(board, other.board);
    }
}
