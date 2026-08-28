import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;

record Pos(int row, int col) implements Iterable<Pos> {
    static final ArrayList<Pos> ALL_POS = new ArrayList<>();

    static {
        for (int row = 0; row < Main.SIZE; ++row)
            for (int col = 0; col < Main.SIZE; ++col) ALL_POS.add(new Pos(row, col));
    }

    Pos add(Pos pos) {
        return new Pos(row + pos.row, col + pos.col);
    }

    boolean inRange() {
        return 0 <= row && row < Main.SIZE && 0 <= col && col < Main.SIZE;
    }

    void search(Set<Pos> group, Predicate<Pos> condition) {
        for (var stack = new ArrayList<>(List.of(this)); !stack.isEmpty();) {
            Pos pos = stack.removeLast();
            if (group.add(pos)) for (Pos n : pos) if (condition.test(n)) stack.add(n);
        }
    }

    int toInt() {
        return row * Main.SIZE + col;
    }

    @Override
    public Iterator<Pos> iterator() {
        var neighbors = new ArrayList<Pos>();
        for (Pos d : List.of(new Pos(1, 0), new Pos(-1, 0), new Pos(0, 1), new Pos(0, -1))) {
            Pos n = add(d);
            if (n.inRange()) neighbors.add(n);
        }
        return neighbors.iterator();
    }
}