import java.util.HashSet;
import java.util.Iterator;

record Group(HashSet<Pos> pieces, HashSet<Pos> liberties) implements Iterable<Pos> {
    Group() {
        this(new HashSet<>(), new HashSet<>());
    }

    boolean isEaten() {
        return liberties.isEmpty();
    }

    @Override
    public Iterator<Pos> iterator() {
        return pieces.iterator();
    }
}
