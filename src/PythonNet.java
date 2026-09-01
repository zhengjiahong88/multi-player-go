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
        String line = reader.readLine();
        if (line == null) throw new IOException("晚安");
        var input = line.split(" ");
        var output = new double[size];
        for (int i = 0; i < size; ++i) output[i] = Double.parseDouble(input[i]);
        return output;
    }

    void write(String string) throws IOException {
        writer.write(string);
        writer.newLine();
        writer.flush();
    }

    void writeState(double[][][] state) throws IOException {
        StringBuilder s = new StringBuilder();
        for (var channel : state) for (var row : channel) for (double value : row) s.append(value).append(' ');
        write(s.toString());
    }

    void writeList(double[] list) throws IOException {
        StringBuilder s = new StringBuilder();
        for (double d : list) s.append(d).append(' ');
        write(s.toString());
    }

    synchronized NetResult evaluate(double[][][] state) throws IOException {
        writeState(state);
        return new NetResult(read(Main.ACTION_SIZE), read(Main.PLAYER_COUNT));
    }

    synchronized LearnResult learn(TrainingData[] trainingData, double[] z) throws IOException {
        write(trainingData.length + "");
        for (TrainingData td : trainingData) {
            writeState(td.state());
            writeList(td.pi());
        }
        writeList(z);
        var loss = read(3);
        return new LearnResult(loss[0], loss[1], loss[2]);
    }

    @Override
    public void close() {
        process.destroy();
    }
}