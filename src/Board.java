import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;

record Board(int[][] board, int player) {
    Board(int player) {
        this(new int[Main.SIZE][Main.SIZE], player);
    }
    Board(Board parent) {
        this(parent.nextPlayer());
        for (int i = 0; i < Main.SIZE; ++i) board[i] = parent.board[i].clone();
    }

    int get(Pos pos) {
        return board[pos.row()][pos.col()];
    }

    void set(Pos pos, int value) {
        board[pos.row()][pos.col()] = value;
    }

    Group getGroup(Pos pos) {
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

    double[][][] getState() {
        var state = new double[Main.PLAYER_COUNT][Main.SIZE][Main.SIZE];
        for (Pos pos : Pos.ALL_POS) if (get(pos) != 0) state[get(pos) - 1][pos.row()][pos.col()] = 1;
        return state;
    }

    int nextPlayer() {
        return player == Main.PLAYER_COUNT ? 1 : player + 1;
    }

    double[] getZ() {
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
        var z = new double[Main.PLAYER_COUNT];
        for (int i = 0; i < Main.PLAYER_COUNT; ++i) z[i] = (double) scores[i] / sum;
        return z;
    }

    Board pass() {
        return new Board(this);
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

    boolean isEqual(Board other) {
        return Arrays.deepEquals(board, other.board);
    }

    void print() {
        for (var row : board) {
            for (int value : row) System.out.print(value + " ");
            System.out.println();
        }
    }
}
