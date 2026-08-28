import java.io.*;

class PythonNet implements AutoCloseable {
    private final Process process;
    private final BufferedWriter writer;
    private final BufferedReader reader;

    PythonNet(String python, String script) throws IOException {
        process = new ProcessBuilder(python, script, String.valueOf(Main.SIZE), String.valueOf(Main.PLAYER_COUNT))
                .redirectError(ProcessBuilder.Redirect.INHERIT).start();
        writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));
        reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
    }

    double[] read(int size) throws IOException {
        var input = reader.readLine().split(" ");
        var output = new double[size];
        for (int i = 0; i < size; ++i) output[i] = Double.parseDouble(input[i]);
        return output;
    }

    synchronized NetResult evaluate(double[][][] state) throws IOException {
        StringBuilder s = new StringBuilder();
        for (var channel : state) for (var row : channel) for (double value : row) s.append(value).append(' ');
        writer.write(s.toString());
        writer.newLine();
        writer.flush();
        return new NetResult(read(Main.ACTION_SIZE), read(Main.PLAYER_COUNT));
    }

    @Override
    public void close() {
        process.destroy();
    }
}